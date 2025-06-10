import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AvailabilityScheduleService } from './availability_schedule.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleValidationService } from '../schedule_validation/schedule_validation.service';
import { CreateAvailabilityScheduleDto } from './dto';

describe('AvailabilityScheduleService', () => {
  let service: AvailabilityScheduleService;

  const mockPrismaService = {
    instructor: {
      findUnique: jest.fn(),
    },
    availabilitySchedule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockScheduleValidationService = {
    validateDateRange: jest.fn(),
    checkScheduleConflicts: jest.fn(),
    checkScheduleConflictsForUpdate: jest.fn(),
  };

  const mockInstructor = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  };

  const mockAvailability = {
    id: 1,
    instructorId: 1,
    startDateTime: new Date('2025-06-10T10:00:00Z'),
    endDateTime: new Date('2025-06-10T12:00:00Z'),
    isRecurring: false,
    recurrenceRule: null,
    expiryDate: null,
    note: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityScheduleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ScheduleValidationService,
          useValue: mockScheduleValidationService,
        },
      ],
    }).compile();

    service = module.get<AvailabilityScheduleService>(
      AvailabilityScheduleService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAvailability', () => {
    const instructorId = 1;
    const availabilityData: CreateAvailabilityScheduleDto = {
      startDateTime: '2025-06-10T10:00:00Z',
      endDateTime: '2025-06-10T12:00:00Z',
      isRecurring: false,
    };

    beforeEach(() => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.create.mockResolvedValue(
        mockAvailability,
      );
      mockScheduleValidationService.validateDateRange.mockImplementation(
        () => {},
      );
      mockScheduleValidationService.checkScheduleConflicts.mockResolvedValue(
        undefined,
      );
    });

    it('should create availability successfully', async () => {
      const result = await service.createAvailability(
        instructorId,
        availabilityData,
      );

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockScheduleValidationService.validateDateRange,
      ).toHaveBeenCalledWith(
        new Date(availabilityData.startDateTime),
        new Date(availabilityData.endDateTime),
      );
      expect(
        mockScheduleValidationService.checkScheduleConflicts,
      ).toHaveBeenCalledWith(
        instructorId,
        new Date(availabilityData.startDateTime),
        new Date(availabilityData.endDateTime),
      );
      expect(
        mockPrismaService.availabilitySchedule.create,
      ).toHaveBeenCalledWith({
        data: {
          instructorId,
          startDateTime: new Date(availabilityData.startDateTime),
          endDateTime: new Date(availabilityData.endDateTime),
          isRecurring: false,
          recurrenceRule: null,
          expiryDate: null,
          note: null,
        },
      });
      expect(result).toEqual(mockAvailability);
    });

    it('should throw NotFoundException when instructor does not exist', async () => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      await expect(
        service.createAvailability(instructorId, availabilityData),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.createAvailability(instructorId, availabilityData),
      ).rejects.toThrow(`Instructeur avec l'ID ${instructorId} non trouvé`);
    });

    it('should create recurring availability with all fields', async () => {
      const recurringData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-06-10T10:00:00Z',
        endDateTime: '2025-06-10T12:00:00Z',
        isRecurring: true,
        recurrenceRule: 'WEEKLY',
        expiryDate: '2025-12-31T23:59:59Z',
        note: 'Test note',
      };

      await service.createAvailability(instructorId, recurringData);

      expect(
        mockPrismaService.availabilitySchedule.create,
      ).toHaveBeenCalledWith({
        data: {
          instructorId,
          startDateTime: new Date(recurringData.startDateTime),
          endDateTime: new Date(recurringData.endDateTime),
          isRecurring: true,
          recurrenceRule: 'WEEKLY',
          expiryDate: recurringData.expiryDate
            ? new Date(recurringData.expiryDate)
            : null,
          note: 'Test note',
        },
      });
    });

    it('should validate recurrence rules', async () => {
      const invalidRecurringData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-06-10T10:00:00Z',
        endDateTime: '2025-06-10T12:00:00Z',
        isRecurring: true,
        // Missing recurrenceRule
      };

      await expect(
        service.createAvailability(instructorId, invalidRecurringData),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createAvailability(instructorId, invalidRecurringData),
      ).rejects.toThrow(
        'La règle de récurrence est requise pour les disponibilités récurrentes',
      );
    });

    it('should reject expiry date for non-recurring availability', async () => {
      const invalidData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-06-10T10:00:00Z',
        endDateTime: '2025-06-10T12:00:00Z',
        isRecurring: false,
        expiryDate: '2025-12-31T23:59:59Z',
      };

      await expect(
        service.createAvailability(instructorId, invalidData),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createAvailability(instructorId, invalidData),
      ).rejects.toThrow(
        "La date d'expiration n'est pas applicable pour les disponibilités non récurrentes",
      );
    });

    it('should reject past expiry date', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Hier
      const futureStartDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Demain
      const futureEndDate = new Date(
        futureStartDate.getTime() + 2 * 60 * 60 * 1000,
      ); // 2h après

      const pastExpiryData: CreateAvailabilityScheduleDto = {
        startDateTime: futureStartDate.toISOString(),
        endDateTime: futureEndDate.toISOString(),
        isRecurring: true,
        recurrenceRule: 'WEEKLY',
        expiryDate: pastDate.toISOString(),
      };

      await expect(
        service.createAvailability(instructorId, pastExpiryData),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createAvailability(instructorId, pastExpiryData),
      ).rejects.toThrow(
        "La date d'expiration doit être postérieure à la date actuelle",
      );
    });

    it('should reject expiry date before start/end dates for recurring availability', async () => {
      // Créer des dates relatives à maintenant pour éviter les problèmes de dates codées en dur
      const now = new Date();
      const startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Dans 7 jours
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 heures après le début
      const expiryDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // Dans 3 jours (avant start/end)

      const invalidExpiryData: CreateAvailabilityScheduleDto = {
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        isRecurring: true,
        recurrenceRule: 'WEEKLY',
        expiryDate: expiryDate.toISOString(),
      };

      await expect(
        service.createAvailability(instructorId, invalidExpiryData),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.createAvailability(instructorId, invalidExpiryData),
      ).rejects.toThrow(
        "La date d'expiration doit être postérieure aux dates de début et de fin",
      );
    });
  });

  describe('getAllAvailabilitiesByInstructorId', () => {
    const instructorId = 1;

    beforeEach(() => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.findMany.mockResolvedValue([
        mockAvailability,
      ]);
    });

    it('should return all availabilities for instructor', async () => {
      const result =
        await service.getAllAvailabilitiesByInstructorId(instructorId);

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.availabilitySchedule.findMany,
      ).toHaveBeenCalledWith({
        where: { instructorId },
        orderBy: { startDateTime: 'asc' },
      });
      expect(result).toEqual([mockAvailability]);
    });

    it('should throw NotFoundException when instructor does not exist', async () => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      await expect(
        service.getAllAvailabilitiesByInstructorId(instructorId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.getAllAvailabilitiesByInstructorId(instructorId),
      ).rejects.toThrow(`Instructeur avec l'ID ${instructorId} non trouvé`);
    });
  });

  describe('modifyAvailability', () => {
    const instructorId = 1;
    const availabilityId = 1;
    const updateData: CreateAvailabilityScheduleDto = {
      startDateTime: '2025-06-10T14:00:00Z',
      endDateTime: '2025-06-10T16:00:00Z',
      isRecurring: false,
    };

    beforeEach(() => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(
        mockAvailability,
      );
      mockPrismaService.availabilitySchedule.update.mockResolvedValue({
        ...mockAvailability,
        ...updateData,
      });
      mockScheduleValidationService.validateDateRange.mockImplementation(
        () => {},
      );
      mockScheduleValidationService.checkScheduleConflictsForUpdate.mockResolvedValue(
        undefined,
      );
    });

    it('should modify availability successfully', async () => {
      const result = await service.modifyAvailability(
        instructorId,
        availabilityId,
        updateData,
      );

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.availabilitySchedule.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: availabilityId },
      });
      expect(
        mockScheduleValidationService.validateDateRange,
      ).toHaveBeenCalledWith(
        new Date(updateData.startDateTime),
        new Date(updateData.endDateTime),
      );
      expect(
        mockScheduleValidationService.checkScheduleConflictsForUpdate,
      ).toHaveBeenCalledWith(
        instructorId,
        new Date(updateData.startDateTime),
        new Date(updateData.endDateTime),
      );
      expect(
        mockPrismaService.availabilitySchedule.update,
      ).toHaveBeenCalledWith({
        where: { id: availabilityId },
        data: {
          startDateTime: new Date(updateData.startDateTime),
          endDateTime: new Date(updateData.endDateTime),
          isRecurring: false,
          recurrenceRule: null,
          expiryDate: null,
          note: null,
        },
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when instructor does not exist', async () => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      await expect(
        service.modifyAvailability(instructorId, availabilityId, updateData),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.modifyAvailability(instructorId, availabilityId, updateData),
      ).rejects.toThrow(`Instructeur avec l'ID ${instructorId} non trouvé`);
    });

    it('should throw NotFoundException when availability does not exist', async () => {
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(null);

      await expect(
        service.modifyAvailability(instructorId, availabilityId, updateData),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.modifyAvailability(instructorId, availabilityId, updateData),
      ).rejects.toThrow(
        `Disponibilité avec l'ID ${availabilityId} non trouvée`,
      );
    });

    it('should throw BadRequestException when availability does not belong to instructor', async () => {
      const otherInstructorAvailability = {
        ...mockAvailability,
        instructorId: 2, // Different instructor
      };
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(
        otherInstructorAvailability,
      );

      await expect(
        service.modifyAvailability(instructorId, availabilityId, updateData),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.modifyAvailability(instructorId, availabilityId, updateData),
      ).rejects.toThrow(
        `Cette disponibilité n'appartient pas à l'instructeur ${instructorId}`,
      );
    });

    it('should update recurring availability with all fields', async () => {
      const recurringUpdateData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-06-10T14:00:00Z',
        endDateTime: '2025-06-10T16:00:00Z',
        isRecurring: true,
        recurrenceRule: 'MONTHLY',
        expiryDate: '2025-12-31T23:59:59Z',
        note: 'Updated note',
      };

      await service.modifyAvailability(
        instructorId,
        availabilityId,
        recurringUpdateData,
      );

      expect(
        mockPrismaService.availabilitySchedule.update,
      ).toHaveBeenCalledWith({
        where: { id: availabilityId },
        data: {
          startDateTime: new Date(recurringUpdateData.startDateTime),
          endDateTime: new Date(recurringUpdateData.endDateTime),
          isRecurring: true,
          recurrenceRule: 'MONTHLY',
          expiryDate: new Date(recurringUpdateData.expiryDate!),
          note: 'Updated note',
        },
      });
    });
  });

  describe('deleteAvailability', () => {
    const instructorId = 1;
    const availabilityId = 1;

    beforeEach(() => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(
        mockAvailability,
      );
      mockPrismaService.availabilitySchedule.delete.mockResolvedValue(
        mockAvailability,
      );
    });

    it('should delete availability successfully', async () => {
      const result = await service.deleteAvailability(
        instructorId,
        availabilityId,
      );

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.availabilitySchedule.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: availabilityId },
      });
      expect(
        mockPrismaService.availabilitySchedule.delete,
      ).toHaveBeenCalledWith({
        where: { id: availabilityId },
      });
      expect(result).toEqual(mockAvailability);
    });

    it('should throw NotFoundException when instructor does not exist', async () => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteAvailability(instructorId, availabilityId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.deleteAvailability(instructorId, availabilityId),
      ).rejects.toThrow(`Instructeur avec l'ID ${instructorId} non trouvé`);
    });

    it('should throw NotFoundException when availability does not exist', async () => {
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteAvailability(instructorId, availabilityId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.deleteAvailability(instructorId, availabilityId),
      ).rejects.toThrow(
        `Disponibilité avec l'ID ${availabilityId} non trouvée`,
      );
    });

    it('should throw BadRequestException when availability does not belong to instructor', async () => {
      const otherInstructorAvailability = {
        ...mockAvailability,
        instructorId: 2, // Different instructor
      };
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(
        otherInstructorAvailability,
      );

      await expect(
        service.deleteAvailability(instructorId, availabilityId),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.deleteAvailability(instructorId, availabilityId),
      ).rejects.toThrow(
        `Cette disponibilité n'appartient pas à l'instructeur ${instructorId}`,
      );
    });
  });

  describe('validateRecurrenceExpiry (private method testing through public methods)', () => {
    const instructorId = 1;

    beforeEach(() => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockScheduleValidationService.validateDateRange.mockImplementation(
        () => {},
      );
      mockScheduleValidationService.checkScheduleConflicts.mockResolvedValue(
        undefined,
      );
    });

    it('should validate recurring availability requires recurrence rule', async () => {
      const invalidData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-06-10T10:00:00Z',
        endDateTime: '2025-06-10T12:00:00Z',
        isRecurring: true,
        // Missing recurrenceRule
      };

      await expect(
        service.createAvailability(instructorId, invalidData),
      ).rejects.toThrow(
        'La règle de récurrence est requise pour les disponibilités récurrentes',
      );
    });

    it('should validate expiry date is not allowed for non-recurring availability', async () => {
      const invalidData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-06-10T10:00:00Z',
        endDateTime: '2025-06-10T12:00:00Z',
        isRecurring: false,
        expiryDate: '2025-12-31T23:59:59Z',
      };

      await expect(
        service.createAvailability(instructorId, invalidData),
      ).rejects.toThrow(
        "La date d'expiration n'est pas applicable pour les disponibilités non récurrentes",
      );
    });

    it('should validate expiry date is in the future', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const invalidData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-06-10T10:00:00Z',
        endDateTime: '2025-06-10T12:00:00Z',
        isRecurring: true,
        recurrenceRule: 'WEEKLY',
        expiryDate: pastDate.toISOString(),
      };

      await expect(
        service.createAvailability(instructorId, invalidData),
      ).rejects.toThrow(
        "La date d'expiration doit être postérieure à la date actuelle",
      );
    });

    it('should validate expiry date is after start and end dates for recurring availability', async () => {
      const now = new Date();

      // Date d'expiration dans le futur mais avant les dates de début/fin
      const expiryDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // Dans 3 jours
      const startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Dans 7 jours
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 heures après start

      const invalidData: CreateAvailabilityScheduleDto = {
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        isRecurring: true,
        recurrenceRule: 'WEEKLY',
        expiryDate: expiryDate.toISOString(),
      };

      await expect(
        service.createAvailability(instructorId, invalidData),
      ).rejects.toThrow(
        "La date d'expiration doit être postérieure aux dates de début et de fin",
      );
    });
  });

  describe('Integration with ScheduleValidationService', () => {
    const instructorId = 1;
    const availabilityData: CreateAvailabilityScheduleDto = {
      startDateTime: '2025-06-10T10:00:00Z',
      endDateTime: '2025-06-10T12:00:00Z',
      isRecurring: false,
    };

    beforeEach(() => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
    });

    it('should propagate validation errors from ScheduleValidationService', async () => {
      const validationError = new BadRequestException('Invalid date range');
      mockScheduleValidationService.validateDateRange.mockImplementation(() => {
        throw validationError;
      });

      await expect(
        service.createAvailability(instructorId, availabilityData),
      ).rejects.toThrow(validationError);
    });

    it('should propagate schedule conflict errors from ScheduleValidationService', async () => {
      const conflictError = new BadRequestException('Schedule conflict');
      mockScheduleValidationService.validateDateRange.mockImplementation(
        () => {},
      );
      mockScheduleValidationService.checkScheduleConflicts.mockRejectedValue(
        conflictError,
      );

      await expect(
        service.createAvailability(instructorId, availabilityData),
      ).rejects.toThrow(conflictError);
    });

    it('should use checkScheduleConflictsForUpdate in modify method', async () => {
      const availabilityId = 1;
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(
        mockAvailability,
      );
      mockPrismaService.availabilitySchedule.update.mockResolvedValue(
        mockAvailability,
      );
      mockScheduleValidationService.validateDateRange.mockImplementation(
        () => {},
      );
      mockScheduleValidationService.checkScheduleConflictsForUpdate.mockResolvedValue(
        undefined,
      );

      await service.modifyAvailability(
        instructorId,
        availabilityId,
        availabilityData,
      );

      expect(
        mockScheduleValidationService.checkScheduleConflictsForUpdate,
      ).toHaveBeenCalledWith(
        instructorId,
        new Date(availabilityData.startDateTime),
        new Date(availabilityData.endDateTime),
      );
      expect(
        mockScheduleValidationService.checkScheduleConflicts,
      ).not.toHaveBeenCalled();
    });
  });
});
