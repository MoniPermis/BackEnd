import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UnavailabilityService } from './unavailability.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleValidationService } from '../schedule_validation/schedule_validation.service';
import { CreateUnavailabilityDto } from './dto';
import { UpdateUnavailabilityDto } from './dto/update-unavailability.dto';

describe('UnavailabilityService', () => {
  let service: UnavailabilityService;

  const mockPrismaService = {
    instructor: {
      findUnique: jest.fn(),
    },
    instructorUnavailability: {
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
    checkScheduleConflictsForUpdate: jest.fn(), // Added missing method
  };

  const mockInstructor = {
    id: 1,
    priceId: 1,
    firstName: 'John',
    lastName: 'Doe',
    gender: 'M',
    email: 'john.doe@example.com',
    phoneNumber: '0123456789',
    address: '123 Test Street',
    password: 'hashedpassword',
    siret: '12345678901234',
    driverLicenceUrl: 'http://example.com/licence.pdf',
    registrationCertificateUrl: 'http://example.com/registration.pdf',
    insuranceCertificateUrl: 'http://example.com/insurance.pdf',
    degreeUrl: 'http://example.com/degree.pdf',
    teachingAuthorizationUrl: 'http://example.com/authorization.pdf',
    profilePictureUrl: 'http://example.com/profile.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    iban: 'FR1420041010050500013M02606',
    bic: 'CCBPFRPPXXX',
  };

  const mockUnavailability = {
    id: 1,
    instructorId: 1,
    startDateTime: new Date('2024-06-15T09:00:00Z'),
    endDateTime: new Date('2024-06-15T17:00:00Z'),
    reason: 'Congés',
  };

  const mockCreateUnavailabilityDto: CreateUnavailabilityDto = {
    startDateTime: '2024-06-15T09:00:00Z',
    endDateTime: '2024-06-15T17:00:00Z',
    reason: 'Congés',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnavailabilityService,
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

    service = module.get<UnavailabilityService>(UnavailabilityService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUnavailability', () => {
    const instructorId = 1;

    beforeEach(() => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.instructorUnavailability.create.mockResolvedValue(
        mockUnavailability,
      );
      mockScheduleValidationService.validateDateRange.mockImplementation(
        () => {},
      );
      mockScheduleValidationService.checkScheduleConflicts.mockResolvedValue(
        undefined,
      );
    });

    it('should create unavailability successfully when instructor exists and validation passes', async () => {
      const result = await service.createUnavailability(
        instructorId,
        mockCreateUnavailabilityDto,
      );

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockScheduleValidationService.validateDateRange,
      ).toHaveBeenCalledWith(
        new Date(mockCreateUnavailabilityDto.startDateTime),
        new Date(mockCreateUnavailabilityDto.endDateTime),
      );
      expect(
        mockScheduleValidationService.checkScheduleConflicts,
      ).toHaveBeenCalledWith(
        instructorId,
        new Date(mockCreateUnavailabilityDto.startDateTime),
        new Date(mockCreateUnavailabilityDto.endDateTime),
      );
      expect(
        mockPrismaService.instructorUnavailability.create,
      ).toHaveBeenCalledWith({
        data: {
          instructorId,
          startDateTime: new Date(mockCreateUnavailabilityDto.startDateTime),
          endDateTime: new Date(mockCreateUnavailabilityDto.endDateTime),
          reason: mockCreateUnavailabilityDto.reason,
        },
      });
      expect(result).toEqual(mockUnavailability);
    });

    it('should throw NotFoundException when instructor does not exist', async () => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      await expect(
        service.createUnavailability(instructorId, mockCreateUnavailabilityDto),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.createUnavailability(instructorId, mockCreateUnavailabilityDto),
      ).rejects.toThrow(`Instructeur avec l'ID ${instructorId} non trouvé`);

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockScheduleValidationService.validateDateRange,
      ).not.toHaveBeenCalled();
      expect(
        mockScheduleValidationService.checkScheduleConflicts,
      ).not.toHaveBeenCalled();
      expect(
        mockPrismaService.instructorUnavailability.create,
      ).not.toHaveBeenCalled();
    });

    it('should propagate validation errors from scheduleValidation.validateDateRange', async () => {
      const validationError = new BadRequestException(
        'Date de fin antérieure à la date de début',
      );
      mockScheduleValidationService.validateDateRange.mockImplementation(() => {
        throw validationError;
      });

      await expect(
        service.createUnavailability(instructorId, mockCreateUnavailabilityDto),
      ).rejects.toThrow(validationError);

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockScheduleValidationService.validateDateRange,
      ).toHaveBeenCalledWith(
        new Date(mockCreateUnavailabilityDto.startDateTime),
        new Date(mockCreateUnavailabilityDto.endDateTime),
      );
      expect(
        mockScheduleValidationService.checkScheduleConflicts,
      ).not.toHaveBeenCalled();
      expect(
        mockPrismaService.instructorUnavailability.create,
      ).not.toHaveBeenCalled();
    });

    it('should propagate validation errors from scheduleValidation.checkScheduleConflicts', async () => {
      const conflictError = new BadRequestException(
        'Conflit avec un rendez-vous existant',
      );
      mockScheduleValidationService.checkScheduleConflicts.mockRejectedValue(
        conflictError,
      );

      await expect(
        service.createUnavailability(instructorId, mockCreateUnavailabilityDto),
      ).rejects.toThrow(conflictError);

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockScheduleValidationService.validateDateRange,
      ).toHaveBeenCalledWith(
        new Date(mockCreateUnavailabilityDto.startDateTime),
        new Date(mockCreateUnavailabilityDto.endDateTime),
      );
      expect(
        mockScheduleValidationService.checkScheduleConflicts,
      ).toHaveBeenCalledWith(
        instructorId,
        new Date(mockCreateUnavailabilityDto.startDateTime),
        new Date(mockCreateUnavailabilityDto.endDateTime),
      );
      expect(
        mockPrismaService.instructorUnavailability.create,
      ).not.toHaveBeenCalled();
    });

    it('should handle Prisma errors during unavailability creation', async () => {
      const prismaError = new Error('Database connection failed');
      mockPrismaService.instructorUnavailability.create.mockRejectedValue(
        prismaError,
      );

      await expect(
        service.createUnavailability(instructorId, mockCreateUnavailabilityDto),
      ).rejects.toThrow(prismaError);

      expect(
        mockPrismaService.instructorUnavailability.create,
      ).toHaveBeenCalledWith({
        data: {
          instructorId,
          startDateTime: new Date(mockCreateUnavailabilityDto.startDateTime),
          endDateTime: new Date(mockCreateUnavailabilityDto.endDateTime),
          reason: mockCreateUnavailabilityDto.reason,
        },
      });
    });

    it('should handle invalid date strings', async () => {
      const invalidDto = {
        startDateTime: 'invalid-date',
        endDateTime: '2024-06-15T17:00:00Z',
        reason: 'Test',
      };

      // The Date constructor will create an Invalid Date, which should be caught by validateDateRange
      const validationError = new BadRequestException(
        'Format de date invalide',
      );
      mockScheduleValidationService.validateDateRange.mockImplementation(() => {
        throw validationError;
      });

      await expect(
        service.createUnavailability(
          instructorId,
          invalidDto as CreateUnavailabilityDto,
        ),
      ).rejects.toThrow(validationError);
    });
  });

  describe('getAllUnavailabilitiesByInstructorId', () => {
    const instructorId = 1;

    beforeEach(() => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
    });

    it('should return all unavailabilities for existing instructor ordered by startDateTime', async () => {
      const mockUnavailabilities = [
        {
          ...mockUnavailability,
          id: 1,
          startDateTime: new Date('2024-06-15T09:00:00Z'),
        },
        {
          ...mockUnavailability,
          id: 2,
          startDateTime: new Date('2024-06-20T09:00:00Z'),
        },
      ];

      mockPrismaService.instructorUnavailability.findMany.mockResolvedValue(
        mockUnavailabilities,
      );

      const result =
        await service.getAllUnavailabilitiesByInstructorId(instructorId);

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.instructorUnavailability.findMany,
      ).toHaveBeenCalledWith({
        where: { instructorId },
        orderBy: { startDateTime: 'asc' },
      });
      expect(result).toEqual(mockUnavailabilities);
    });

    it('should return empty array when instructor exists but has no unavailabilities', async () => {
      mockPrismaService.instructorUnavailability.findMany.mockResolvedValue([]);

      const result =
        await service.getAllUnavailabilitiesByInstructorId(instructorId);

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.instructorUnavailability.findMany,
      ).toHaveBeenCalledWith({
        where: { instructorId },
        orderBy: { startDateTime: 'asc' },
      });
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when instructor does not exist', async () => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      await expect(
        service.getAllUnavailabilitiesByInstructorId(instructorId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.getAllUnavailabilitiesByInstructorId(instructorId),
      ).rejects.toThrow(`Instructeur avec l'ID ${instructorId} non trouvé`);

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.instructorUnavailability.findMany,
      ).not.toHaveBeenCalled();
    });

    it('should handle Prisma errors during unavailabilities retrieval', async () => {
      const prismaError = new Error('Database connection failed');
      mockPrismaService.instructorUnavailability.findMany.mockRejectedValue(
        prismaError,
      );

      await expect(
        service.getAllUnavailabilitiesByInstructorId(instructorId),
      ).rejects.toThrow(prismaError);

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.instructorUnavailability.findMany,
      ).toHaveBeenCalledWith({
        where: { instructorId },
        orderBy: { startDateTime: 'asc' },
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle instructor with id 0', async () => {
      const instructorId = 0;
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      await expect(
        service.getAllUnavailabilitiesByInstructorId(instructorId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.getAllUnavailabilitiesByInstructorId(instructorId),
      ).rejects.toThrow(`Instructeur avec l'ID ${instructorId} non trouvé`);
    });

    it('should handle negative instructor id', async () => {
      const instructorId = -1;
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      await expect(
        service.createUnavailability(instructorId, mockCreateUnavailabilityDto),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.createUnavailability(instructorId, mockCreateUnavailabilityDto),
      ).rejects.toThrow(`Instructeur avec l'ID ${instructorId} non trouvé`);
    });
  });

  describe('Integration with ScheduleValidationService', () => {
    const instructorId = 1;

    beforeEach(() => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
    });

    it('should propagate validation errors from ScheduleValidationService', async () => {
      const validationError = new BadRequestException('Invalid date range');
      mockScheduleValidationService.validateDateRange.mockImplementation(() => {
        throw validationError;
      });

      await expect(
        service.createUnavailability(instructorId, mockCreateUnavailabilityDto),
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
        service.createUnavailability(instructorId, mockCreateUnavailabilityDto),
      ).rejects.toThrow(conflictError);
    });
  });

  describe('modifyUnavailability', () => {
    const instructorId = 1;
    const unavailabilityId = 1;

    const mockUpdatedUnavailability = {
      ...mockUnavailability,
      id: unavailabilityId,
      startDateTime: new Date('2024-06-20T10:00:00Z'),
      endDateTime: new Date('2024-06-20T18:00:00Z'),
      reason: 'Congés modifiés',
    };

    const mockModifyUnavailabilityDto: UpdateUnavailabilityDto = {
      startDateTime: '2024-06-20T10:00:00Z',
      endDateTime: '2024-06-20T18:00:00Z',
      reason: 'Congés modifiés',
    };

    beforeEach(() => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.instructorUnavailability.findUnique.mockResolvedValue(
        mockUnavailability,
      );
      mockPrismaService.instructorUnavailability.update.mockResolvedValue(
        mockUpdatedUnavailability,
      );
      mockScheduleValidationService.validateDateRange.mockImplementation(
        () => {},
      );
      mockScheduleValidationService.checkScheduleConflictsForUpdate.mockResolvedValue(
        undefined,
      );
    });

    it('should modify unavailability successfully when instructor and unavailability exist and validation passes', async () => {
      const result = await service.modifyUnavailability(
        instructorId,
        unavailabilityId,
        mockModifyUnavailabilityDto,
      );

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.instructorUnavailability.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: unavailabilityId },
      });
      expect(
        mockScheduleValidationService.validateDateRange,
      ).toHaveBeenCalledWith(
        new Date(mockModifyUnavailabilityDto.startDateTime),
        new Date(mockModifyUnavailabilityDto.endDateTime),
      );
      expect(
        mockScheduleValidationService.checkScheduleConflictsForUpdate,
      ).toHaveBeenCalledWith(
        instructorId,
        new Date(mockModifyUnavailabilityDto.startDateTime),
        new Date(mockModifyUnavailabilityDto.endDateTime),
        undefined,
        unavailabilityId,
      );
      expect(
        mockPrismaService.instructorUnavailability.update,
      ).toHaveBeenCalledWith({
        where: { id: unavailabilityId },
        data: {
          startDateTime: new Date(mockModifyUnavailabilityDto.startDateTime),
          endDateTime: new Date(mockModifyUnavailabilityDto.endDateTime),
          reason: mockModifyUnavailabilityDto.reason,
        },
      });
      expect(result).toEqual(mockUpdatedUnavailability);
    });

    it('should throw NotFoundException when instructor does not exist', async () => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      await expect(
        service.modifyUnavailability(
          instructorId,
          unavailabilityId,
          mockModifyUnavailabilityDto,
        ),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.modifyUnavailability(
          instructorId,
          unavailabilityId,
          mockModifyUnavailabilityDto,
        ),
      ).rejects.toThrow(`Instructeur avec l'ID ${instructorId} non trouvé`);

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.instructorUnavailability.findUnique,
      ).not.toHaveBeenCalled();
      expect(
        mockScheduleValidationService.validateDateRange,
      ).not.toHaveBeenCalled();
      expect(
        mockScheduleValidationService.checkScheduleConflictsForUpdate,
      ).not.toHaveBeenCalled();
      expect(
        mockPrismaService.instructorUnavailability.update,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when unavailability does not exist', async () => {
      mockPrismaService.instructorUnavailability.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.modifyUnavailability(
          instructorId,
          unavailabilityId,
          mockModifyUnavailabilityDto,
        ),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.modifyUnavailability(
          instructorId,
          unavailabilityId,
          mockModifyUnavailabilityDto,
        ),
      ).rejects.toThrow(
        `Indisponibilité avec l'ID ${unavailabilityId} non trouvée`,
      );

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.instructorUnavailability.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: unavailabilityId },
      });
      expect(
        mockScheduleValidationService.validateDateRange,
      ).not.toHaveBeenCalled();
      expect(
        mockScheduleValidationService.checkScheduleConflictsForUpdate,
      ).not.toHaveBeenCalled();
      expect(
        mockPrismaService.instructorUnavailability.update,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when unavailability does not belong to the instructor', async () => {
      const unavailabilityOfAnotherInstructor = {
        ...mockUnavailability,
        id: unavailabilityId,
        instructorId: 2, // Different instructor ID
      };
      mockPrismaService.instructorUnavailability.findUnique.mockResolvedValue(
        unavailabilityOfAnotherInstructor,
      );

      await expect(
        service.modifyUnavailability(
          instructorId,
          unavailabilityId,
          mockModifyUnavailabilityDto,
        ),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.modifyUnavailability(
          instructorId,
          unavailabilityId,
          mockModifyUnavailabilityDto,
        ),
      ).rejects.toThrow(
        `Indisponibilité avec l'ID ${unavailabilityId} n'appartient pas à l'instructeur avec l'ID ${instructorId}`,
      );

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.instructorUnavailability.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: unavailabilityId },
      });
      expect(
        mockScheduleValidationService.validateDateRange,
      ).not.toHaveBeenCalled();
      expect(
        mockScheduleValidationService.checkScheduleConflictsForUpdate,
      ).not.toHaveBeenCalled();
      expect(
        mockPrismaService.instructorUnavailability.update,
      ).not.toHaveBeenCalled();
    });

    it('should propagate validation errors from scheduleValidation.validateDateRange', async () => {
      const validationError = new BadRequestException(
        'Date de fin antérieure à la date de début',
      );
      mockScheduleValidationService.validateDateRange.mockImplementation(() => {
        throw validationError;
      });

      await expect(
        service.modifyUnavailability(
          instructorId,
          unavailabilityId,
          mockModifyUnavailabilityDto,
        ),
      ).rejects.toThrow(validationError);

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.instructorUnavailability.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: unavailabilityId },
      });
      expect(
        mockScheduleValidationService.validateDateRange,
      ).toHaveBeenCalledWith(
        new Date(mockModifyUnavailabilityDto.startDateTime),
        new Date(mockModifyUnavailabilityDto.endDateTime),
      );
      expect(
        mockScheduleValidationService.checkScheduleConflictsForUpdate,
      ).not.toHaveBeenCalled();
      expect(
        mockPrismaService.instructorUnavailability.update,
      ).not.toHaveBeenCalled();
    });

    it('should propagate validation errors from scheduleValidation.checkScheduleConflictsForUpdate', async () => {
      const conflictError = new BadRequestException(
        'Conflit avec un rendez-vous existant',
      );
      mockScheduleValidationService.checkScheduleConflictsForUpdate.mockRejectedValue(
        conflictError,
      );

      await expect(
        service.modifyUnavailability(
          instructorId,
          unavailabilityId,
          mockModifyUnavailabilityDto,
        ),
      ).rejects.toThrow(conflictError);

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.instructorUnavailability.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: unavailabilityId },
      });
      expect(
        mockScheduleValidationService.validateDateRange,
      ).toHaveBeenCalledWith(
        new Date(mockModifyUnavailabilityDto.startDateTime),
        new Date(mockModifyUnavailabilityDto.endDateTime),
      );
      expect(
        mockScheduleValidationService.checkScheduleConflictsForUpdate,
      ).toHaveBeenCalledWith(
        instructorId,
        new Date(mockModifyUnavailabilityDto.startDateTime),
        new Date(mockModifyUnavailabilityDto.endDateTime),
        undefined,
        unavailabilityId,
      );
      expect(
        mockPrismaService.instructorUnavailability.update,
      ).not.toHaveBeenCalled();
    });

    it('should handle Prisma errors during unavailability update', async () => {
      const prismaError = new Error('Database connection failed');
      mockPrismaService.instructorUnavailability.update.mockRejectedValue(
        prismaError,
      );

      await expect(
        service.modifyUnavailability(
          instructorId,
          unavailabilityId,
          mockModifyUnavailabilityDto,
        ),
      ).rejects.toThrow(prismaError);

      expect(
        mockPrismaService.instructorUnavailability.update,
      ).toHaveBeenCalledWith({
        where: { id: unavailabilityId },
        data: {
          startDateTime: new Date(mockModifyUnavailabilityDto.startDateTime),
          endDateTime: new Date(mockModifyUnavailabilityDto.endDateTime),
          reason: mockModifyUnavailabilityDto.reason,
        },
      });
    });
  });

  describe('deleteUnavailability', () => {
    const instructorId = 1;
    const unavailabilityId = 1;

    beforeEach(() => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.instructorUnavailability.findUnique.mockResolvedValue(
        mockUnavailability,
      );
      mockPrismaService.instructorUnavailability.delete = jest
        .fn()
        .mockResolvedValue(undefined);
    });

    it('should delete unavailability successfully when instructor and unavailability exist', async () => {
      await service.deleteUnavailability(instructorId, unavailabilityId);

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.instructorUnavailability.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: unavailabilityId },
      });
      expect(
        mockPrismaService.instructorUnavailability.delete,
      ).toHaveBeenCalledWith({
        where: { id: unavailabilityId },
      });
    });

    it('should throw NotFoundException when instructor does not exist', async () => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteUnavailability(instructorId, unavailabilityId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.deleteUnavailability(instructorId, unavailabilityId),
      ).rejects.toThrow(`Instructeur avec l'ID ${instructorId} non trouvé`);

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.instructorUnavailability.findUnique,
      ).not.toHaveBeenCalled();
      expect(
        mockPrismaService.instructorUnavailability.delete,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when unavailability does not exist', async () => {
      mockPrismaService.instructorUnavailability.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.deleteUnavailability(instructorId, unavailabilityId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.deleteUnavailability(instructorId, unavailabilityId),
      ).rejects.toThrow(
        `Indisponibilité avec l'ID ${unavailabilityId} non trouvée`,
      );

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.instructorUnavailability.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: unavailabilityId },
      });
      expect(
        mockPrismaService.instructorUnavailability.delete,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when unavailability does not belong to the instructor', async () => {
      const unavailabilityOfAnotherInstructor = {
        ...mockUnavailability,
        instructorId: 2, // Different instructor ID
      };
      mockPrismaService.instructorUnavailability.findUnique.mockResolvedValue(
        unavailabilityOfAnotherInstructor,
      );

      await expect(
        service.deleteUnavailability(instructorId, unavailabilityId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.deleteUnavailability(instructorId, unavailabilityId),
      ).rejects.toThrow(
        `Indisponibilité avec l'ID ${unavailabilityId} n'appartient pas à l'instructeur avec l'ID ${instructorId}`,
      );

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.instructorUnavailability.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: unavailabilityId },
      });
      expect(
        mockPrismaService.instructorUnavailability.delete,
      ).not.toHaveBeenCalled();
    });

    it('should handle Prisma errors during unavailability deletion', async () => {
      const prismaError = new Error('Database error during deletion');
      mockPrismaService.instructorUnavailability.delete.mockRejectedValue(
        prismaError,
      );

      await expect(
        service.deleteUnavailability(instructorId, unavailabilityId),
      ).rejects.toThrow(prismaError);

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(
        mockPrismaService.instructorUnavailability.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: unavailabilityId },
      });
      expect(
        mockPrismaService.instructorUnavailability.delete,
      ).toHaveBeenCalledWith({
        where: { id: unavailabilityId },
      });
    });

    it('should handle non-numeric instructor id', async () => {
      const nonNumericId = 'abc' as unknown as number;

      await expect(
        service.deleteUnavailability(nonNumericId, unavailabilityId),
      ).rejects.toThrow();

      // The specific error might depend on how the service and Prisma handle invalid IDs
      expect(
        mockPrismaService.instructorUnavailability.delete,
      ).not.toHaveBeenCalled();
    });
  });
});
