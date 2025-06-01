import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityScheduleService } from './availability_schedule.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateAvailabilityScheduleDto } from './dto';

describe('AvailabilityScheduleService', () => {
  let service: AvailabilityScheduleService;
  let prismaService: PrismaService;

  // Mock des méthodes Prisma
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAvailability', () => {
    const validInstructorId = 1;
    const validAvailabilityData: CreateAvailabilityScheduleDto = {
      instructorId: 1,
      dayOfWeek: 1, // Mardi
      startTime: '09:00',
      endTime: '17:00',
      isRecurring: true,
      effectiveDate: new Date('2024-01-01'),
      expiryDate: new Date('2024-12-31'),
      note: 'Disponibilité normale',
    };

    const mockInstructor = {
      id: 1,
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
    };

    const mockCreatedAvailability = {
      id: 1,
      instructorId: 1,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      isRecurring: true,
      effectiveDate: new Date('2024-01-01'),
      expiryDate: new Date('2024-12-31'),
      note: 'Disponibilité normale',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('cas de succès', () => {
      it('devrait créer une disponibilité avec succès', async () => {
        // Arrange
        mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
        mockPrismaService.availabilitySchedule.create.mockResolvedValue(mockCreatedAvailability);

        // Act
        const result = await service.createAvailability(validInstructorId, validAvailabilityData);

        // Assert
        expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
          where: { id: validInstructorId },
        });
        expect(mockPrismaService.availabilitySchedule.create).toHaveBeenCalledWith({
          data: {
            instructorId: validInstructorId,
            dayOfWeek: validAvailabilityData.dayOfWeek,
            startTime: validAvailabilityData.startTime,
            endTime: validAvailabilityData.endTime,
            isRecurring: validAvailabilityData.isRecurring,
            effectiveDate: validAvailabilityData.effectiveDate,
            expiryDate: validAvailabilityData.expiryDate,
            note: validAvailabilityData.note,
          },
        });
        expect(result).toEqual(mockCreatedAvailability);
      });

      it('devrait créer une disponibilité sans note', async () => {
        // Arrange
        const dataWithoutNote = { ...validAvailabilityData, note: undefined };
        mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
        mockPrismaService.availabilitySchedule.create.mockResolvedValue(mockCreatedAvailability);

        // Act
        const result = await service.createAvailability(validInstructorId, dataWithoutNote);

        // Assert
        expect(mockPrismaService.availabilitySchedule.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            note: undefined,
          }),
        });
        expect(result).toEqual(mockCreatedAvailability);
      });

      it('devrait créer une disponibilité sans date d\'expiration', async () => {
        // Arrange
        const dataWithoutExpiryDate = { ...validAvailabilityData, expiryDate: undefined };
        mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
        mockPrismaService.availabilitySchedule.create.mockResolvedValue(mockCreatedAvailability);

        // Act
        await service.createAvailability(validInstructorId, dataWithoutExpiryDate);

        // Assert
        expect(mockPrismaService.availabilitySchedule.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            expiryDate: undefined,
          }),
        });
      });
    });

    describe('cas d\'erreur - instructeur non trouvé', () => {
      it('devrait lever une NotFoundException si l\'instructeur n\'existe pas', async () => {
        // Arrange
        mockPrismaService.instructor.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.createAvailability(999, validAvailabilityData)
        ).rejects.toThrow(new NotFoundException('Instructeur avec l\'ID 999 non trouvé'));

        expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
          where: { id: 999 },
        });
        expect(mockPrismaService.availabilitySchedule.create).not.toHaveBeenCalled();
      });
    });

    describe('cas d\'erreur - validation des horaires', () => {
      beforeEach(() => {
        mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      });

      it('devrait lever une BadRequestException si l\'heure de fin est antérieure à l\'heure de début', async () => {
        // Arrange
        const invalidData = {
          ...validAvailabilityData,
          startTime: '17:00',
          endTime: '09:00', // Heure de fin avant heure de début
        };

        // Act & Assert
        await expect(
          service.createAvailability(validInstructorId, invalidData)
        ).rejects.toThrow(new BadRequestException('L\'heure de fin doit être postérieure à l\'heure de début'));

        expect(mockPrismaService.availabilitySchedule.create).not.toHaveBeenCalled();
      });

      it('devrait lever une BadRequestException si l\'heure de fin est égale à l\'heure de début', async () => {
        // Arrange
        const invalidData = {
          ...validAvailabilityData,
          startTime: '09:00',
          endTime: '09:00', // Heures identiques
        };

        // Act & Assert
        await expect(
          service.createAvailability(validInstructorId, invalidData)
        ).rejects.toThrow(new BadRequestException('L\'heure de fin doit être postérieure à l\'heure de début'));

        expect(mockPrismaService.availabilitySchedule.create).not.toHaveBeenCalled();
      });

      it('devrait accepter des horaires valides avec différence minimale', async () => {
        // Arrange
        const validDataMinimalDiff = {
          ...validAvailabilityData,
          startTime: '09:00',
          endTime: '09:01', // 1 minute de différence
        };
        mockPrismaService.availabilitySchedule.create.mockResolvedValue(mockCreatedAvailability);

        // Act
        const result = await service.createAvailability(validInstructorId, validDataMinimalDiff);

        // Assert
        expect(result).toEqual(mockCreatedAvailability);
        expect(mockPrismaService.availabilitySchedule.create).toHaveBeenCalled();
      });
    });

    describe('cas d\'erreur - problèmes de base de données', () => {
      beforeEach(() => {
        mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      });

      it('devrait propager les erreurs de la base de données lors de la vérification de l\'instructeur', async () => {
        // Arrange
        const dbError = new Error('Erreur de connexion à la base de données');
        mockPrismaService.instructor.findUnique.mockRejectedValue(dbError);

        // Act & Assert
        await expect(
          service.createAvailability(validInstructorId, validAvailabilityData)
        ).rejects.toThrow(dbError);
      });

      it('devrait propager les erreurs de la base de données lors de la création', async () => {
        // Arrange
        const dbError = new Error('Erreur lors de la création');
        mockPrismaService.availabilitySchedule.create.mockRejectedValue(dbError);

        // Act & Assert
        await expect(
          service.createAvailability(validInstructorId, validAvailabilityData)
        ).rejects.toThrow(dbError);
      });
    });

    describe('cas limites', () => {
      beforeEach(() => {
        mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
        mockPrismaService.availabilitySchedule.create.mockResolvedValue(mockCreatedAvailability);
      });

      it('devrait gérer les horaires de nuit (passage minuit)', async () => {
        // Arrange
        const nightData = {
          ...validAvailabilityData,
          startTime: '22:00',
          endTime: '23:59',
        };

        // Act
        const result = await service.createAvailability(validInstructorId, nightData);

        // Assert
        expect(result).toEqual(mockCreatedAvailability);
      });

      it('devrait gérer les horaires très tôt le matin', async () => {
        // Arrange
        const earlyMorningData = {
          ...validAvailabilityData,
          startTime: '00:01',
          endTime: '06:00',
        };

        // Act
        const result = await service.createAvailability(validInstructorId, earlyMorningData);

        // Assert
        expect(result).toEqual(mockCreatedAvailability);
      });

      it('devrait gérer un instructorId égal à 0', async () => {
        // Arrange
        mockPrismaService.instructor.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.createAvailability(0, validAvailabilityData)
        ).rejects.toThrow(new NotFoundException('Instructeur avec l\'ID 0 non trouvé'));
      });
    });
  });

  describe('validateAvailabilityTimes (méthode privée - testée indirectement)', () => {
    const mockInstructor = { id: 1, firstName: 'Test', lastName: 'User', email: 'test@example.com' };

    beforeEach(() => {
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
    });

    it('devrait valider correctement des horaires normaux', async () => {
      // Test indirect via createAvailability
      const validData = {
        instructorId: 1,
        dayOfWeek: 1,
        startTime: '08:30',
        endTime: '18:45',
        isRecurring: true,
        effectiveDate: new Date('2024-01-01'),
      };

      mockPrismaService.availabilitySchedule.create.mockResolvedValue({});

      // Ne devrait pas lever d'exception
      await expect(service.createAvailability(1, validData)).resolves.toBeDefined();
    });
  });
});
