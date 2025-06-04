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

    it('should throw BadRequestException when expiryDate is before or equal to startDateTime for recurring availability', async () => {
      // Arrange
      const invalidData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-07-01T10:00:00Z',
        endDateTime: '2025-07-01T12:00:00Z',
        isRecurring: true,
        recurrenceRule: 'WEEKLY',
        expiryDate: '2025-07-01T09:00:00Z', // Avant la date de début
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);

      // Act & Assert
      await expect(
        service.createAvailability(instructorId, invalidData)
      ).rejects.toThrow(
        new BadRequestException('La date d\'expiration doit être postérieure à la date de début pour les disponibilités récurrentes')
      );

      expect(mockPrismaService.availabilitySchedule.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when expiryDate equals startDateTime for recurring availability', async () => {
      // Arrange
      const invalidData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-07-01T10:00:00Z',
        endDateTime: '2025-07-01T12:00:00Z',
        isRecurring: true,
        recurrenceRule: 'WEEKLY',
        expiryDate: '2025-07-01T10:00:00Z', // Égale à la date de début
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);

      // Act & Assert
      await expect(
        service.createAvailability(instructorId, invalidData)
      ).rejects.toThrow(
        new BadRequestException('La date d\'expiration doit être postérieure à la date de début pour les disponibilités récurrentes')
      );

      expect(mockPrismaService.availabilitySchedule.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when expiryDate is before or equal to endDateTime for recurring availability', async () => {
      // Arrange
      const invalidData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-07-01T10:00:00Z',
        endDateTime: '2025-07-01T12:00:00Z',
        isRecurring: true,
        recurrenceRule: 'WEEKLY',
        expiryDate: '2025-07-01T11:00:00Z', // Avant la date de fin
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);

      // Act & Assert
      await expect(
        service.createAvailability(instructorId, invalidData)
      ).rejects.toThrow(
        new BadRequestException('La date d\'expiration doit être postérieure à la date de fin pour les disponibilités récurrentes')
      );

      expect(mockPrismaService.availabilitySchedule.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when expiryDate equals endDateTime for recurring availability', async () => {
      // Arrange
      const invalidData: CreateAvailabilityScheduleDto = {
        startDateTime: '2025-07-01T10:00:00Z',
        endDateTime: '2025-07-01T12:00:00Z',
        isRecurring: true,
        recurrenceRule: 'WEEKLY',
        expiryDate: '2025-07-01T12:00:00Z', // Égale à la date de fin
      };

      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);

      // Act & Assert
      await expect(
        service.createAvailability(instructorId, invalidData)
      ).rejects.toThrow(
        new BadRequestException('La date d\'expiration doit être postérieure à la date de fin pour les disponibilités récurrentes')
      );

      expect(mockPrismaService.availabilitySchedule.create).not.toHaveBeenCalled();
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

describe('AvailabilityScheduleService - getAllAvailabilitiesByInstructorId', () => {
  let service: AvailabilityScheduleService;
  let prismaService: PrismaService;

  // Mock des données de test
  const mockInstructor = {
    id: 1,
    priceId: 1,
    firstName: 'Jean',
    lastName: 'Dupont',
    gender: 'M',
    email: 'jean.dupont@example.com',
    phoneNumber: '0123456789',
    address: '123 rue de la Test',
    password: 'hashedPassword',
    siret: '12345678901234',
    driverLicenceUrl: 'http://example.com/licence.pdf',
    registrationCertificateUrl: 'http://example.com/cert.pdf',
    insuranceCertificateUrl: 'http://example.com/insurance.pdf',
    degreeUrl: 'http://example.com/degree.pdf',
    teachingAuthorizationUrl: 'http://example.com/auth.pdf',
    profilePictureUrl: 'http://example.com/profile.jpg',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    iban: 'FR1420041010050500013M02606',
    bic: 'PSSTFRPPXXX'
  };

  const mockAvailabilities = [
    {
      id: 1,
      instructorId: 1,
      startDateTime: new Date('2024-06-10T09:00:00Z'),
      endDateTime: new Date('2024-06-10T12:00:00Z'),
      isRecurring: false,
      recurrenceRule: null,
      expiryDate: null,
      note: 'Disponibilité matinée'
    },
    {
      id: 2,
      instructorId: 1,
      startDateTime: new Date('2024-06-10T14:00:00Z'),
      endDateTime: new Date('2024-06-10T18:00:00Z'),
      isRecurring: true,
      recurrenceRule: 'WEEKLY',
      expiryDate: new Date('2024-12-31'),
      note: 'Disponibilité après-midi récurrente'
    },
    {
      id: 3,
      instructorId: 1,
      startDateTime: new Date('2024-06-11T08:00:00Z'),
      endDateTime: new Date('2024-06-11T11:00:00Z'),
      isRecurring: false,
      recurrenceRule: null,
      expiryDate: null,
      note: null
    }
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityScheduleService,
        {
          provide: PrismaService,
          useValue: {
            instructor: {
              findUnique: jest.fn(),
            },
            availabilitySchedule: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AvailabilityScheduleService>(AvailabilityScheduleService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cas de succès', () => {
    it('devrait retourner les disponibilités triées par date de début croissante', async () => {
      // Arrange
      const instructorId = 1;
      (prismaService.instructor.findUnique as jest.Mock).mockResolvedValue(mockInstructor);
      (prismaService.availabilitySchedule.findMany as jest.Mock).mockResolvedValue(mockAvailabilities);

      // Act
      const result = await service.getAllAvailabilitiesByInstructorId(instructorId);

      // Assert
      expect(result).toEqual(mockAvailabilities);
      expect(prismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(prismaService.availabilitySchedule.findMany as jest.Mock).toHaveBeenCalledWith({
        where: { instructorId: instructorId },
        orderBy: { startDateTime: 'asc' },
      });
    });

    it('devrait retourner un tableau vide si l\'instructeur n\'a pas de disponibilités', async () => {
      // Arrange
      const instructorId = 1;
      (prismaService.instructor.findUnique as jest.Mock).mockResolvedValue(mockInstructor);
      (prismaService.availabilitySchedule.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await service.getAllAvailabilitiesByInstructorId(instructorId);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(prismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(prismaService.availabilitySchedule.findMany as jest.Mock).toHaveBeenCalledWith({
        where: { instructorId: instructorId },
        orderBy: { startDateTime: 'asc' },
      });
    });
  });

  describe('Cas d\'erreur', () => {
    it('devrait lever une NotFoundException si l\'instructeur n\'existe pas', async () => {
      // Arrange
      const instructorId = 999;
      (prismaService.instructor.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.getAllAvailabilitiesByInstructorId(instructorId))
        .rejects
        .toThrow(new NotFoundException(`Instructeur avec l'ID ${instructorId} non trouvé`));

      expect(prismaService.instructor.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(prismaService.availabilitySchedule.findMany as jest.Mock).not.toHaveBeenCalled();
    });

    it('devrait propager l\'erreur si findUnique lève une exception', async () => {
      // Arrange
      const instructorId = 1;
      const databaseError = new Error('Erreur de base de données');
      (prismaService.instructor.findUnique as jest.Mock).mockRejectedValue(databaseError);

      // Act & Assert
      await expect(service.getAllAvailabilitiesByInstructorId(instructorId))
        .rejects
        .toThrow(databaseError);

      expect(prismaService.instructor.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(prismaService.availabilitySchedule.findMany as jest.Mock).not.toHaveBeenCalled();
    });

    it('devrait propager l\'erreur si findMany lève une exception', async () => {
      // Arrange
      const instructorId = 1;
      const databaseError = new Error('Erreur lors de la récupération des disponibilités');
      (prismaService.instructor.findUnique as jest.Mock).mockResolvedValue(mockInstructor);
      (prismaService.availabilitySchedule.findMany as jest.Mock).mockRejectedValue(databaseError);

      // Act & Assert
      await expect(service.getAllAvailabilitiesByInstructorId(instructorId))
        .rejects
        .toThrow(databaseError);

      expect(prismaService.instructor.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(prismaService.availabilitySchedule.findMany as jest.Mock).toHaveBeenCalledWith({
        where: { instructorId: instructorId },
        orderBy: { startDateTime: 'asc' },
      });
    });
  });

  describe('Validation des paramètres', () => {
    it('devrait fonctionner avec un ID instructeur valide (nombre positif)', async () => {
      // Arrange
      const instructorId = 42;
      (prismaService.instructor.findUnique as jest.Mock).mockResolvedValue({
        ...mockInstructor,
        id: instructorId
      });
      (prismaService.availabilitySchedule.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await service.getAllAvailabilitiesByInstructorId(instructorId);

      // Assert
      expect(result).toEqual([]);
      expect(prismaService.instructor.findUnique as jest.Mock).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
    });

    it('devrait gérer les IDs négatifs ou zéro (qui n\'existeront pas)', async () => {
      // Arrange
      const instructorId = -1;
      (prismaService.instructor.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.getAllAvailabilitiesByInstructorId(instructorId))
        .rejects
        .toThrow(new NotFoundException(`Instructeur avec l'ID ${instructorId} non trouvé`));
    });
  });

  describe('Vérification du tri', () => {
    it('devrait s\'assurer que les disponibilités sont triées par startDateTime croissant', async () => {
      // Arrange
      const instructorId = 1;
      const unorderedAvailabilities = [
        {
          id: 2,
          instructorId: 1,
          startDateTime: new Date('2024-06-12T14:00:00Z'),
          endDateTime: new Date('2024-06-12T18:00:00Z'),
          isRecurring: false,
          recurrenceRule: null,
          expiryDate: null,
          note: 'Deuxième disponibilité'
        },
        {
          id: 1,
          instructorId: 1,
          startDateTime: new Date('2024-06-10T09:00:00Z'),
          endDateTime: new Date('2024-06-10T12:00:00Z'),
          isRecurring: false,
          recurrenceRule: null,
          expiryDate: null,
          note: 'Première disponibilité'
        }
      ];

      (prismaService.instructor.findUnique as jest.Mock).mockResolvedValue(mockInstructor);
      (prismaService.availabilitySchedule.findMany as jest.Mock).mockResolvedValue(unorderedAvailabilities);

      // Act
      const result = await service.getAllAvailabilitiesByInstructorId(instructorId);

      // Assert
      expect(result).toEqual(unorderedAvailabilities);
      expect(prismaService.availabilitySchedule.findMany as jest.Mock).toHaveBeenCalledWith({
        where: { instructorId: instructorId },
        orderBy: { startDateTime: 'asc' },
      });
    });
  });
});