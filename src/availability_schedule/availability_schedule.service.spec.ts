import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AvailabilityScheduleService } from './availability_schedule.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvailabilityScheduleDto } from './dto';

describe('AvailabilityScheduleService', () => {
  let service: AvailabilityScheduleService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    instructor: {
      findUnique: jest.fn(),
    },
    availabilitySchedule: {
      create: jest.fn(),
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

    service = module.get<AvailabilityScheduleService>(AvailabilityScheduleService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAvailability', () => {
    const instructorId = 1;
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
      mockPrismaService.availabilitySchedule.create.mockResolvedValue(expectedResult);

      // Act
      const result = await service.createAvailability(instructorId, validAvailabilityData);

      // Assert
      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(mockPrismaService.availabilitySchedule.create).toHaveBeenCalledWith({
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
      mockPrismaService.availabilitySchedule.create.mockResolvedValue(expectedResult);

      // Act
      const result = await service.createAvailability(instructorId, recurringData);

      // Assert
      expect(mockPrismaService.availabilitySchedule.create).toHaveBeenCalledWith({
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
        service.createAvailability(instructorId, validAvailabilityData)
      ).rejects.toThrow(
        new NotFoundException(`Instructeur avec l'ID ${instructorId} non trouvé`)
      );

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(mockPrismaService.availabilitySchedule.create).not.toHaveBeenCalled();
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
        service.createAvailability(instructorId, invalidData)
      ).rejects.toThrow(
        new BadRequestException('La date de fin doit être postérieure à la date de début')
      );

      expect(mockPrismaService.availabilitySchedule.create).not.toHaveBeenCalled();
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
        service.createAvailability(instructorId, invalidData)
      ).rejects.toThrow(
        new BadRequestException('La date de fin doit être postérieure à la date de début')
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
        service.createAvailability(instructorId, invalidData)
      ).rejects.toThrow(
        new BadRequestException('La règle de récurrence est requise pour les disponibilités récurrentes')
      );

      expect(mockPrismaService.availabilitySchedule.create).not.toHaveBeenCalled();
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
        service.createAvailability(instructorId, invalidData)
      ).rejects.toThrow(
        new BadRequestException('La date d\'expiration n\'est pas applicable pour les disponibilités non récurrentes')
      );

      expect(mockPrismaService.availabilitySchedule.create).not.toHaveBeenCalled();
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
        service.createAvailability(instructorId, invalidData)
      ).rejects.toThrow(
        new BadRequestException('La date d\'expiration doit être postérieure à la date actuelle')
      );

      expect(mockPrismaService.availabilitySchedule.create).not.toHaveBeenCalled();
    });

    it('should handle all recurrence rule types correctly', async () => {
      // Arrange
      const recurrenceRules = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);

      for (const rule of recurrenceRules) {
        const data: CreateAvailabilityScheduleDto = {
          startDateTime: '2025-07-01T10:00:00Z',
          endDateTime: '2025-07-01T12:00:00Z',
          isRecurring: true,
          recurrenceRule: rule,
          expiryDate: '2025-12-31T23:59:59Z',
        };

        const expectedResult = {
          id: 1,
          instructorId: 1,
          startDateTime: new Date('2025-07-01T10:00:00Z'),
          endDateTime: new Date('2025-07-01T12:00:00Z'),
          isRecurring: true,
          recurrenceRule: rule,
          expiryDate: new Date('2025-12-31T23:59:59Z'),
          note: null,
        };

        mockPrismaService.availabilitySchedule.create.mockResolvedValue(expectedResult);

        // Act
        const result = await service.createAvailability(instructorId, data);

        // Assert
        expect(mockPrismaService.availabilitySchedule.create).toHaveBeenCalledWith({
          data: {
            instructorId: 1,
            startDateTime: new Date('2025-07-01T10:00:00Z'),
            endDateTime: new Date('2025-07-01T12:00:00Z'),
            isRecurring: true,
            recurrenceRule: rule,
            expiryDate: new Date('2025-12-31T23:59:59Z'),
            note: null,
          },
        });
        expect(result).toEqual(expectedResult);

        // Reset mock for next iteration
        mockPrismaService.availabilitySchedule.create.mockReset();
      }
    });

    it('should handle optional fields correctly when not provided', async () => {
      // Arrange
      const minimalData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-07-01T10:00:00Z',
        endDateTime: '2025-07-01T12:00:00Z',
        isRecurring: false,
      };

      const expectedResult = {
        id: 1,
        instructorId: 1,
        startDateTime: new Date('2025-07-01T10:00:00Z'),
        endDateTime: new Date('2025-07-01T12:00:00Z'),
        isRecurring: false,
        recurrenceRule: null,
        expiryDate: null,
        note: null,
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.availabilitySchedule.create.mockResolvedValue(expectedResult);

      // Act
      const result = await service.createAvailability(instructorId, minimalData);

      // Assert
      expect(mockPrismaService.availabilitySchedule.create).toHaveBeenCalledWith({
        data: {
          instructorId: 1,
          startDateTime: new Date('2025-07-01T10:00:00Z'),
          endDateTime: new Date('2025-07-01T12:00:00Z'),
          isRecurring: false,
          recurrenceRule: null,
          expiryDate: null,
          note: null,
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockPrismaService.instructor.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        service.createAvailability(instructorId, validAvailabilityData)
      ).rejects.toThrow(dbError);

      expect(mockPrismaService.availabilitySchedule.create).not.toHaveBeenCalled();
    });
  });
});
