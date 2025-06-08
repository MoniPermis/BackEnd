import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AvailabilityScheduleService } from './availability_schedule.service';
import { PrismaService } from '../prisma/prisma.service';
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityScheduleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AvailabilityScheduleService>(
      AvailabilityScheduleService,
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Common test data
  const instructorId = 1;
  const availabilityId = 5;
  const mockInstructor = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  };

  const validAvailabilityData: CreateAvailabilityScheduleDto = {
    startDateTime: '2025-07-01T10:00:00Z',
    endDateTime: '2025-07-01T12:00:00Z',
    isRecurring: false,
    note: 'Disponibilité test',
  };

  describe('createAvailability', () => {
    it('should create availability successfully with valid data', async () => {
      // Arrange
      const expectedResult = {
        id: 1,
        instructorId: 1,
        startDateTime: new Date('2025-07-01T10:00:00Z'),
        endDateTime: new Date('2025-07-01T12:00:00Z'),
        isRecurring: false,
        recurrenceRule: null,
        expiryDate: null,
        note: 'Disponibilité test',
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.create.mockResolvedValue(
        expectedResult,
      );

      // Act
      const result = await service.createAvailability(
        instructorId,
        validAvailabilityData,
      );

      // Assert
      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.availabilitySchedule.create,
      ).toHaveBeenCalledWith({
        data: {
          instructorId: 1,
          startDateTime: new Date('2025-07-01T10:00:00Z'),
          endDateTime: new Date('2025-07-01T12:00:00Z'),
          isRecurring: false,
          recurrenceRule: null,
          expiryDate: null,
          note: 'Disponibilité test',
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should create recurring availability with recurrence rule and expiry date', async () => {
      // Arrange
      const recurringData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-07-01T10:00:00Z',
        endDateTime: '2025-07-01T12:00:00Z',
        isRecurring: true,
        recurrenceRule: 'WEEKLY',
        expiryDate: '2025-12-31T23:59:59Z',
        note: 'Disponibilité récurrente',
      };

      const expectedResult = {
        id: 1,
        instructorId: 1,
        startDateTime: new Date('2025-07-01T10:00:00Z'),
        endDateTime: new Date('2025-07-01T12:00:00Z'),
        isRecurring: true,
        recurrenceRule: 'WEEKLY',
        expiryDate: new Date('2025-12-31T23:59:59Z'),
        note: 'Disponibilité récurrente',
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.create.mockResolvedValue(
        expectedResult,
      );

      // Act
      const result = await service.createAvailability(
        instructorId,
        recurringData,
      );

      // Assert
      expect(
        mockPrismaService.availabilitySchedule.create,
      ).toHaveBeenCalledWith({
        data: {
          instructorId: 1,
          startDateTime: new Date('2025-07-01T10:00:00Z'),
          endDateTime: new Date('2025-07-01T12:00:00Z'),
          isRecurring: true,
          recurrenceRule: 'WEEKLY',
          expiryDate: new Date('2025-12-31T23:59:59Z'),
          note: 'Disponibilité récurrente',
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when instructor does not exist', async () => {
      // Arrange
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createAvailability(instructorId, validAvailabilityData),
      ).rejects.toThrow(
        new NotFoundException(
          `Instructeur avec l'ID ${instructorId} non trouvé`,
        ),
      );

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.availabilitySchedule.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when start date is after or equal to end date', async () => {
      // Arrange
      const invalidData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-07-01T12:00:00Z',
        endDateTime: '2025-07-01T10:00:00Z', // Avant la date de début
        isRecurring: false,
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);

      // Act & Assert
      await expect(
        service.createAvailability(instructorId, invalidData),
      ).rejects.toThrow(
        new BadRequestException(
          'La date de fin doit être postérieure à la date de début',
        ),
      );

      expect(
        mockPrismaService.availabilitySchedule.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when start date equals end date', async () => {
      // Arrange
      const invalidData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-07-01T10:00:00Z',
        endDateTime: '2025-07-01T10:00:00Z', // Même date
        isRecurring: false,
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);

      // Act & Assert
      await expect(
        service.createAvailability(instructorId, invalidData),
      ).rejects.toThrow(
        new BadRequestException(
          'La date de fin doit être postérieure à la date de début',
        ),
      );
    });

    it('should throw BadRequestException when isRecurring is true but recurrenceRule is missing', async () => {
      // Arrange
      const invalidData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-07-01T10:00:00Z',
        endDateTime: '2025-07-01T12:00:00Z',
        isRecurring: true,
        // recurrenceRule manquant
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);

      // Act & Assert
      await expect(
        service.createAvailability(instructorId, invalidData),
      ).rejects.toThrow(
        new BadRequestException(
          'La règle de récurrence est requise pour les disponibilités récurrentes',
        ),
      );

      expect(
        mockPrismaService.availabilitySchedule.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when expiryDate is provided but isRecurring is false', async () => {
      // Arrange
      const invalidData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-07-01T10:00:00Z',
        endDateTime: '2025-07-01T12:00:00Z',
        isRecurring: false,
        expiryDate: '2025-12-31T23:59:59Z', // Date d'expiration sans récurrence
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);

      // Act & Assert
      await expect(
        service.createAvailability(instructorId, invalidData),
      ).rejects.toThrow(
        new BadRequestException(
          "La date d'expiration n'est pas applicable pour les disponibilités non récurrentes",
        ),
      );

      expect(
        mockPrismaService.availabilitySchedule.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when expiryDate is in the past', async () => {
      // Arrange
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Hier

      const invalidData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-07-01T10:00:00Z',
        endDateTime: '2025-07-01T12:00:00Z',
        isRecurring: true,
        recurrenceRule: 'WEEKLY',
        expiryDate: pastDate.toISOString(),
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);

      // Act & Assert
      await expect(
        service.createAvailability(instructorId, invalidData),
      ).rejects.toThrow(
        new BadRequestException(
          "La date d'expiration doit être postérieure à la date actuelle",
        ),
      );

      expect(
        mockPrismaService.availabilitySchedule.create,
      ).not.toHaveBeenCalled();
    });
  });

  describe('getAllAvailabilitiesByInstructorId', () => {
    it('should return all availabilities for an instructor', async () => {
      // Arrange
      const availabilities = [
        {
          id: 1,
          instructorId: instructorId,
          startDateTime: new Date('2025-07-01T10:00:00Z'),
          endDateTime: new Date('2025-07-01T12:00:00Z'),
          isRecurring: false,
          recurrenceRule: null,
          expiryDate: null,
          note: 'Disponibilité 1',
        },
        {
          id: 2,
          instructorId: instructorId,
          startDateTime: new Date('2025-07-02T10:00:00Z'),
          endDateTime: new Date('2025-07-02T12:00:00Z'),
          isRecurring: true,
          recurrenceRule: 'WEEKLY',
          expiryDate: new Date('2025-12-31T23:59:59Z'),
          note: 'Disponibilité 2',
        },
      ];

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.findMany.mockResolvedValue(
        availabilities,
      );

      // Act
      const result =
        await service.getAllAvailabilitiesByInstructorId(instructorId);

      // Assert
      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.availabilitySchedule.findMany,
      ).toHaveBeenCalledWith({
        where: { instructorId: instructorId },
        orderBy: { startDateTime: 'asc' },
      });
      expect(result).toEqual(availabilities);
    });

    it('should return empty array when instructor has no availabilities', async () => {
      // Arrange
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.findMany.mockResolvedValue([]);

      // Act
      const result =
        await service.getAllAvailabilitiesByInstructorId(instructorId);

      // Assert
      expect(
        mockPrismaService.availabilitySchedule.findMany,
      ).toHaveBeenCalledWith({
        where: { instructorId: instructorId },
        orderBy: { startDateTime: 'asc' },
      });
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when instructor does not exist', async () => {
      // Arrange
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getAllAvailabilitiesByInstructorId(instructorId),
      ).rejects.toThrow(
        new NotFoundException(
          `Instructeur avec l'ID ${instructorId} non trouvé`,
        ),
      );

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.availabilitySchedule.findMany,
      ).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockPrismaService.instructor.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        service.getAllAvailabilitiesByInstructorId(instructorId),
      ).rejects.toThrow(dbError);

      expect(
        mockPrismaService.availabilitySchedule.findMany,
      ).not.toHaveBeenCalled();
    });
  });

  describe('modifyAvailability', () => {
    const mockAvailability = {
      id: availabilityId,
      instructorId: instructorId,
      startDateTime: new Date('2025-07-01T10:00:00Z'),
      endDateTime: new Date('2025-07-01T12:00:00Z'),
      isRecurring: false,
      recurrenceRule: null,
      expiryDate: null,
      note: 'Disponibilité originale',
    };

    it('should successfully modify availability with valid data', async () => {
      // Arrange
      const updateData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-07-01T11:00:00Z', // Modifié
        endDateTime: '2025-07-01T13:00:00Z', // Modifié
        isRecurring: false,
        note: 'Disponibilité modifiée',
      };

      const expectedResult = {
        ...mockAvailability,
        startDateTime: new Date('2025-07-01T11:00:00Z'),
        endDateTime: new Date('2025-07-01T13:00:00Z'),
        note: 'Disponibilité modifiée',
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(
        mockAvailability,
      );
      mockPrismaService.availabilitySchedule.update.mockResolvedValue(
        expectedResult,
      );

      // Act
      const result = await service.modifyAvailability(
        instructorId,
        availabilityId,
        updateData,
      );

      // Assert
      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.availabilitySchedule.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: availabilityId },
      });
      expect(
        mockPrismaService.availabilitySchedule.update,
      ).toHaveBeenCalledWith({
        where: { id: availabilityId },
        data: {
          startDateTime: new Date('2025-07-01T11:00:00Z'),
          endDateTime: new Date('2025-07-01T13:00:00Z'),
          isRecurring: false,
          recurrenceRule: null,
          expiryDate: null,
          note: 'Disponibilité modifiée',
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should successfully modify availability to make it recurring', async () => {
      // Arrange
      const updateData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-07-01T10:00:00Z',
        endDateTime: '2025-07-01T12:00:00Z',
        isRecurring: true,
        recurrenceRule: 'WEEKLY',
        expiryDate: '2025-12-31T23:59:59Z',
        note: 'Disponibilité désormais récurrente',
      };

      const expectedResult = {
        ...mockAvailability,
        isRecurring: true,
        recurrenceRule: 'WEEKLY',
        expiryDate: new Date('2025-12-31T23:59:59Z'),
        note: 'Disponibilité désormais récurrente',
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(
        mockAvailability,
      );
      mockPrismaService.availabilitySchedule.update.mockResolvedValue(
        expectedResult,
      );

      // Act
      const result = await service.modifyAvailability(
        instructorId,
        availabilityId,
        updateData,
      );

      // Assert
      expect(
        mockPrismaService.availabilitySchedule.update,
      ).toHaveBeenCalledWith({
        where: { id: availabilityId },
        data: {
          startDateTime: new Date('2025-07-01T10:00:00Z'),
          endDateTime: new Date('2025-07-01T12:00:00Z'),
          isRecurring: true,
          recurrenceRule: 'WEEKLY',
          expiryDate: new Date('2025-12-31T23:59:59Z'),
          note: 'Disponibilité désormais récurrente',
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when instructor does not exist', async () => {
      // Arrange
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.modifyAvailability(
          instructorId,
          availabilityId,
          validAvailabilityData,
        ),
      ).rejects.toThrow(
        new NotFoundException(
          `Instructeur avec l'ID ${instructorId} non trouvé`,
        ),
      );

      expect(
        mockPrismaService.availabilitySchedule.update,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when availability does not exist', async () => {
      // Arrange
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.modifyAvailability(
          instructorId,
          availabilityId,
          validAvailabilityData,
        ),
      ).rejects.toThrow(
        new NotFoundException(
          `Disponibilité avec l'ID ${availabilityId} non trouvée`,
        ),
      );

      expect(
        mockPrismaService.availabilitySchedule.update,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when availability does not belong to instructor', async () => {
      // Arrange
      const differentInstructorId = 2;
      const availabilityWithDifferentInstructor = {
        ...mockAvailability,
        instructorId: differentInstructorId,
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(
        availabilityWithDifferentInstructor,
      );

      // Act & Assert
      await expect(
        service.modifyAvailability(
          instructorId,
          availabilityId,
          validAvailabilityData,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          `Cette disponibilité n'appartient pas à l'instructeur ${instructorId}`,
        ),
      );

      expect(
        mockPrismaService.availabilitySchedule.update,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when validation fails on update data', async () => {
      // Arrange
      const invalidData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-07-01T10:00:00Z',
        endDateTime: '2025-07-01T09:00:00Z', // Fin avant début
        isRecurring: false,
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(
        mockAvailability,
      );

      // Act & Assert
      await expect(
        service.modifyAvailability(instructorId, availabilityId, invalidData),
      ).rejects.toThrow(
        new BadRequestException(
          'La date de fin doit être postérieure à la date de début',
        ),
      );

      expect(
        mockPrismaService.availabilitySchedule.update,
      ).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully during update', async () => {
      // Arrange
      const dbError = new Error('Database update failed');
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(
        mockAvailability,
      );
      mockPrismaService.availabilitySchedule.update.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        service.modifyAvailability(
          instructorId,
          availabilityId,
          validAvailabilityData,
        ),
      ).rejects.toThrow(dbError);
    });
  });
  describe('deleteAvailability', () => {
    const mockAvailability = {
      id: availabilityId,
      instructorId: instructorId,
      startDateTime: new Date('2025-07-01T10:00:00Z'),
      endDateTime: new Date('2025-07-01T12:00:00Z'),
      isRecurring: false,
      recurrenceRule: null,
      expiryDate: null,
      note: 'Disponibilité à supprimer',
    };

    beforeEach(() => {
      mockPrismaService.availabilitySchedule.delete = jest.fn();
    });

    it('should successfully delete availability with valid data', async () => {
      // Arrange
      const expectedResult = {
        ...mockAvailability,
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(
        mockAvailability,
      );
      mockPrismaService.availabilitySchedule.delete.mockResolvedValue(
        expectedResult,
      );

      // Act
      const result = await service.deleteAvailability(
        instructorId,
        availabilityId,
      );

      // Assert
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
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when instructor does not exist', async () => {
      // Arrange
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.deleteAvailability(instructorId, availabilityId),
      ).rejects.toThrow(
        new NotFoundException(
          `Instructeur avec l'ID ${instructorId} non trouvé`,
        ),
      );

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.availabilitySchedule.findUnique,
      ).not.toHaveBeenCalled();
      expect(
        mockPrismaService.availabilitySchedule.delete,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when availability does not exist', async () => {
      // Arrange
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.deleteAvailability(instructorId, availabilityId),
      ).rejects.toThrow(
        new NotFoundException(
          `Disponibilité avec l'ID ${availabilityId} non trouvée`,
        ),
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
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when availability does not belong to instructor', async () => {
      // Arrange
      const differentInstructorId = 2;
      const availabilityWithDifferentInstructor = {
        ...mockAvailability,
        instructorId: differentInstructorId,
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(
        availabilityWithDifferentInstructor,
      );

      // Act & Assert
      await expect(
        service.deleteAvailability(instructorId, availabilityId),
      ).rejects.toThrow(
        new BadRequestException(
          `Cette disponibilité n'appartient pas à l'instructeur ${instructorId}`,
        ),
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
      ).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully during deletion', async () => {
      // Arrange
      const dbError = new Error('Database deletion failed');
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(
        mockAvailability,
      );
      mockPrismaService.availabilitySchedule.delete.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        service.deleteAvailability(instructorId, availabilityId),
      ).rejects.toThrow(dbError);

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
    });

    it('should successfully delete recurring availability', async () => {
      // Arrange
      const recurringAvailability = {
        ...mockAvailability,
        isRecurring: true,
        recurrenceRule: 'WEEKLY',
        expiryDate: new Date('2025-12-31T23:59:59Z'),
        note: 'Disponibilité récurrente à supprimer',
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(
        recurringAvailability,
      );
      mockPrismaService.availabilitySchedule.delete.mockResolvedValue(
        recurringAvailability,
      );

      // Act
      const result = await service.deleteAvailability(
        instructorId,
        availabilityId,
      );

      // Assert
      expect(
        mockPrismaService.availabilitySchedule.delete,
      ).toHaveBeenCalledWith({
        where: { id: availabilityId },
      });
      expect(result).toEqual(recurringAvailability);
    });

    it('should handle deletion with different instructor and availability IDs', async () => {
      // Arrange
      const differentInstructorId = 10;
      const differentAvailabilityId = 25;
      const mockInstructorDifferent = {
        id: differentInstructorId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
      };
      const mockAvailabilityDifferent = {
        ...mockAvailability,
        id: differentAvailabilityId,
        instructorId: differentInstructorId,
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructorDifferent);
      mockPrismaService.availabilitySchedule.findUnique.mockResolvedValue(
        mockAvailabilityDifferent,
      );
      mockPrismaService.availabilitySchedule.delete.mockResolvedValue(
        mockAvailabilityDifferent,
      );

      // Act
      const result = await service.deleteAvailability(
        differentInstructorId,
        differentAvailabilityId,
      );

      // Assert
      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: differentInstructorId },
      });
      expect(
        mockPrismaService.availabilitySchedule.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: differentAvailabilityId },
      });
      expect(
        mockPrismaService.availabilitySchedule.delete,
      ).toHaveBeenCalledWith({
        where: { id: differentAvailabilityId },
      });
      expect(result).toEqual(mockAvailabilityDifferent);
    });
  });
});
