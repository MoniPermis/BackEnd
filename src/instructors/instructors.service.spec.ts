import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { InstructorsService } from './instructors.service';
import { NotFoundException } from '@nestjs/common';
import { CreateDeletedInstructorDto } from './dto/create-instructor.dto';

describe('InstructorsService', () => {
  let service: InstructorsService;

  const mockPrisma = {
    instructor: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    deletedInstructor: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstructorsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<InstructorsService>(InstructorsService);

    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all Instructor', async () => {
      const fakedata = [
        {
          id: 1,
          priceId: 1,
          firstName: 'hugo',
          lastName: 'boss',
          gender: 'male',
          email: 'user@example.com',
          phoneNumber: '0606060606',
          address: 'this is fake address',
          password: 'password123',
          siret: '1234',
          driverLicenceUrl: 'string',
          registrationCertificateUrl: 'string',
          insuranceCertificateUrl: 'string',
          degreeUrl: 'string',
          teachingAuthorizationUrl: 'string',
          profilePictureUrl: null,
          createdAt: '2025-06-15T00:00:00.000Z',
          updatedAt: '2025-06-15T00:00:00.000Z',
          iban: '1243',
          bic: '123',
        },
        {
          id: 2,
          priceId: 1,
          firstName: 'hugo',
          lastName: 'boss',
          gender: 'male',
          email: 'user2@example.com',
          phoneNumber: '0909090909',
          address: 'this is fake address',
          password: 'password123',
          siret: '1235',
          driverLicenceUrl: 'string',
          registrationCertificateUrl: 'string',
          insuranceCertificateUrl: 'string',
          degreeUrl: 'string',
          teachingAuthorizationUrl: 'string',
          profilePictureUrl: null,
          createdAt: '2025-06-15T00:00:00.000Z',
          updatedAt: '2025-06-15T00:00:00.000Z',
          iban: '12431',
          bic: '123',
        },
      ];
      mockPrisma.instructor.findMany.mockResolvedValue(fakedata);

      expect(await service.getAllInstructors()).toEqual(fakedata);
      expect(mockPrisma.instructor.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getInstructorById', () => {
    it('should throw if instructor not found', async () => {
      const param = 1;
      mockPrisma.instructor.findUnique.mockResolvedValue(null);

      await expect(service.getInstructorById(param)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockPrisma.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: param },
      });
      expect(mockPrisma.instructor.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return instructor if instructor exists', async () => {
      const param = 2;
      const instructor = {
        id: 2,
        priceId: 2,
        firstName: 'hugo',
        lastName: 'boss',
        gender: 'male',
        email: 'user2@example.com',
        phoneNumber: '0909090909',
        address: 'this is fake address',
        password: 'password123',
        siret: '1235',
        driverLicenceUrl: 'string',
        registrationCertificateUrl: 'string',
        insuranceCertificateUrl: 'string',
        degreeUrl: 'string',
        teachingAuthorizationUrl: 'string',
        profilePictureUrl: '',
        createdAt: '2025-06-15T00:00:00.000Z',
        updatedAt: '2025-06-15T00:00:00.000Z',
        iban: '12431',
        bic: '123',
      };
      mockPrisma.instructor.findUnique.mockResolvedValue(instructor);

      const result = await service.getInstructorById(param);

      expect(result).toEqual(instructor);
      expect(mockPrisma.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: param },
      });
      expect(mockPrisma.instructor.findUnique).toHaveBeenCalledTimes(1);
    });
  });
  describe('createDeletedInstructor', () => {
    const mockInstructor = {
      id: 1,
      priceId: 1,
      firstName: 'John',
      lastName: 'Doe',
      gender: 'M',
      email: 'john.doe@example.com',
      phoneNumber: '+33123456789',
      address: '123 Main St, Paris',
      password: 'hashedPassword',
      siret: '12345678901234',
      driverLicenceUrl: 'https://example.com/licence.pdf',
      registrationCertificateUrl: 'https://example.com/registration.pdf',
      insuranceCertificateUrl: 'https://example.com/insurance.pdf',
      degreeUrl: 'https://example.com/degree.pdf',
      teachingAuthorizationUrl: 'https://example.com/authorization.pdf',
      profilePictureUrl: 'https://example.com/profile.jpg',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      iban: 'FR1420041010050500013M02606',
      bic: 'CCBPFRPP',
    };

    const mockDeletedInstructor = {
      id: 1,
      originalInstructorId: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      siret: '12345678901234',
      iban: 'FR1420041010050500013M02606',
      deletedAt: new Date(),
    };

    const mockCreateDeletedInstructorDto: CreateDeletedInstructorDto = {
      originalInstructorId: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      siret: '12345678901234',
      iban: 'FR1420041010050500013M02606',
    };

    it('should successfully create a deleted instructor when instructor exists', async () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const expectedDeletedInstructor = {
        ...mockDeletedInstructor,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        deletedAt: expect.any(Date),
      };

      jest
        .spyOn(mockPrisma.instructor, 'findUnique')
        .mockResolvedValue(mockInstructor);
      jest
        .spyOn(mockPrisma.deletedInstructor, 'create')
        .mockResolvedValue(mockDeletedInstructor);

      // Act
      const result = await service.createDeletedInstructor(
        mockCreateDeletedInstructorDto,
      );

      // Assert
      expect(mockPrisma.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: mockCreateDeletedInstructorDto.originalInstructorId },
      });

      expect(mockPrisma.deletedInstructor.create).toHaveBeenCalledWith({
        data: {
          originalInstructorId: mockInstructor.id,
          firstName: mockInstructor.firstName,
          lastName: mockInstructor.lastName,
          email: mockInstructor.email,
          siret: mockInstructor.siret,
          iban: mockInstructor.iban,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          deletedAt: expect.any(Date),
        },
      });

      expect(result).toEqual(mockDeletedInstructor);
    });

    it('should throw NotFoundException when instructor does not exist', async () => {
      // Arrange
      jest.spyOn(mockPrisma.instructor, 'findUnique').mockResolvedValue(null);
      jest
        .spyOn(mockPrisma.deletedInstructor, 'create')
        .mockResolvedValue(mockDeletedInstructor);

      // Act & Assert
      await expect(
        service.createDeletedInstructor(mockCreateDeletedInstructorDto),
      ).rejects.toThrow(new NotFoundException('Instructeur non trouvé'));

      expect(mockPrisma.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: mockCreateDeletedInstructorDto.originalInstructorId },
      });

      expect(mockPrisma.deletedInstructor.create).not.toHaveBeenCalled();
    });

    it('should use data from existing instructor, not from DTO', async () => {
      // Arrange
      const dtoWithDifferentData: CreateDeletedInstructorDto = {
        originalInstructorId: 1,
        firstName: 'Different',
        lastName: 'Name',
        email: 'different@example.com',
        siret: '98765432109876',
        iban: 'FR7630001007941234567890185',
      };

      jest
        .spyOn(mockPrisma.instructor, 'findUnique')
        .mockResolvedValue(mockInstructor);
      jest
        .spyOn(mockPrisma.deletedInstructor, 'create')
        .mockResolvedValue(mockDeletedInstructor);

      // Act
      await service.createDeletedInstructor(dtoWithDifferentData);

      // Assert
      expect(mockPrisma.deletedInstructor.create).toHaveBeenCalledWith({
        data: {
          originalInstructorId: mockInstructor.id,
          firstName: mockInstructor.firstName, // Should use existing instructor data
          lastName: mockInstructor.lastName, // Should use existing instructor data
          email: mockInstructor.email, // Should use existing instructor data
          siret: mockInstructor.siret, // Should use existing instructor data
          iban: mockInstructor.iban, // Should use existing instructor data
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          deletedAt: expect.any(Date),
        },
      });
    });

    it('should set deletedAt to current date', async () => {
      // Arrange
      const mockDate = new Date('2024-12-01T10:00:00Z');
      const dateSpy = jest
        .spyOn(global, 'Date')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        .mockImplementation(() => mockDate as any);

      jest
        .spyOn(mockPrisma.instructor, 'findUnique')
        .mockResolvedValue(mockInstructor);
      jest
        .spyOn(mockPrisma.deletedInstructor, 'create')
        .mockResolvedValue(mockDeletedInstructor);

      // Act
      await service.createDeletedInstructor(mockCreateDeletedInstructorDto);

      // Assert
      expect(mockPrisma.deletedInstructor.create).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          deletedAt: mockDate,
        }),
      });

      dateSpy.mockRestore();
    });

    it('should handle database errors when creating deleted instructor', async () => {
      // Arrange
      const databaseError = new Error('Database connection failed');

      jest
        .spyOn(mockPrisma.instructor, 'findUnique')
        .mockResolvedValue(mockInstructor);
      jest
        .spyOn(mockPrisma.deletedInstructor, 'create')
        .mockRejectedValue(databaseError);

      // Act & Assert
      await expect(
        service.createDeletedInstructor(mockCreateDeletedInstructorDto),
      ).rejects.toThrow(databaseError);

      expect(mockPrisma.instructor.findUnique).toHaveBeenCalled();
      expect(mockPrisma.deletedInstructor.create).toHaveBeenCalled();
    });

    it('should handle database errors when finding instructor', async () => {
      // Arrange
      const databaseError = new Error('Database connection failed');

      jest
        .spyOn(mockPrisma.instructor, 'findUnique')
        .mockRejectedValue(databaseError);
      jest
        .spyOn(mockPrisma.deletedInstructor, 'create')
        .mockResolvedValue(mockDeletedInstructor);

      // Act & Assert
      await expect(
        service.createDeletedInstructor(mockCreateDeletedInstructorDto),
      ).rejects.toThrow(databaseError);

      expect(mockPrisma.instructor.findUnique).toHaveBeenCalled();
      expect(mockPrisma.deletedInstructor.create).not.toHaveBeenCalled();
    });
  });
});
