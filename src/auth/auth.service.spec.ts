import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstructorDto } from './dto';
import * as argon from 'argon2';

jest.mock('argon2');
const mockedArgon = argon as jest.Mocked<typeof argon>;

describe('AuthService', () => {
  let service: AuthService;
  let mockPrismaService: {
    instructor: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
    price: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
  };

  const mockCreateInstructorDto: CreateInstructorDto = {
    firstName: 'John',
    lastName: 'Doe',
    gender: 'MALE',
    email: 'john.doe@example.com',
    password: 'password123',
    phoneNumber: '+33123456789',
    address: '123 Main St, Paris, France',
    driverLicenceUrl: 'https://example.com/driver-licence.pdf',
    registrationCertificateUrl: 'https://example.com/registration.pdf',
    insuranceCertificateUrl: 'https://example.com/insurance.pdf',
    degreeUrl: 'https://example.com/degree.pdf',
    teachingAuthorizationUrl: 'https://example.com/teaching-auth.pdf',
    profilePictureUrl: 'https://example.com/profile.jpg',
    iban: 'FR1420041010050500013M02606',
    bic: 'CCBPFRPP',
    siret: '12345678901234',
    amount: 50,
    currency: 'EUR',
  };

  const mockExistingPrice = {
    id: 1,
    amount: 50,
    currency: 'EUR',
  };

  const mockCreatedInstructor = {
    id: 1,
    priceId: 1,
    firstName: 'John',
    lastName: 'Doe',
    gender: 'MALE',
    email: 'john.doe@example.com',
    password: 'hashedPassword',
    phoneNumber: '+33123456789',
    address: '123 Main St, Paris, France',
    driverLicenceUrl: 'https://example.com/driver-licence.pdf',
    registrationCertificateUrl: 'https://example.com/registration.pdf',
    insuranceCertificateUrl: 'https://example.com/insurance.pdf',
    degreeUrl: 'https://example.com/degree.pdf',
    teachingAuthorizationUrl: 'https://example.com/teaching-auth.pdf',
    profilePictureUrl: 'https://example.com/profile.jpg',
    iban: 'FR1420041010050500013M02606',
    bic: 'hashedBic',
    siret: '12345678901234',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockPrismaService = {
      instructor: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      price: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
    mockedArgon.hash.mockResolvedValue('hashedPassword');
  });

  describe('instructorSignup', () => {
    it('should successfully create a new instructor with existing price', async () => {
      // Arrange
      mockPrismaService.instructor.findFirst.mockResolvedValue(null);
      mockPrismaService.price.findFirst.mockResolvedValue(mockExistingPrice);
      mockPrismaService.instructor.create.mockResolvedValue(
        mockCreatedInstructor,
      );

      mockedArgon.hash
        .mockResolvedValueOnce('hashedPassword') // for password
        .mockResolvedValueOnce('hashedBic'); // for bic

      // Act
      const result = await service.instructorSignup(mockCreateInstructorDto);

      // Assert
      expect(mockPrismaService.instructor.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: mockCreateInstructorDto.email },
            { siret: mockCreateInstructorDto.siret },
            { iban: mockCreateInstructorDto.iban },
          ],
        },
      });

      expect(mockedArgon.hash).toHaveBeenCalledTimes(2);
      expect(mockedArgon.hash).toHaveBeenNthCalledWith(
        1,
        mockCreateInstructorDto.password,
      );
      expect(mockedArgon.hash).toHaveBeenNthCalledWith(
        2,
        mockCreateInstructorDto.bic,
      );

      expect(mockPrismaService.price.findFirst).toHaveBeenCalledWith({
        where: {
          amount: mockCreateInstructorDto.amount,
          currency: mockCreateInstructorDto.currency,
        },
      });

      expect(mockPrismaService.price.create).not.toHaveBeenCalled();

      expect(mockPrismaService.instructor.create).toHaveBeenCalledWith({
        data: {
          priceId: mockExistingPrice.id,
          firstName: mockCreateInstructorDto.firstName,
          lastName: mockCreateInstructorDto.lastName,
          gender: mockCreateInstructorDto.gender,
          email: mockCreateInstructorDto.email,
          password: 'hashedPassword',
          phoneNumber: mockCreateInstructorDto.phoneNumber,
          address: mockCreateInstructorDto.address,
          driverLicenceUrl: mockCreateInstructorDto.driverLicenceUrl,
          registrationCertificateUrl:
            mockCreateInstructorDto.registrationCertificateUrl,
          insuranceCertificateUrl:
            mockCreateInstructorDto.insuranceCertificateUrl,
          degreeUrl: mockCreateInstructorDto.degreeUrl,
          teachingAuthorizationUrl:
            mockCreateInstructorDto.teachingAuthorizationUrl,
          profilePictureUrl: mockCreateInstructorDto.profilePictureUrl,
          iban: mockCreateInstructorDto.iban,
          bic: 'hashedBic',
          siret: mockCreateInstructorDto.siret,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          createdAt: expect.any(Date),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          updatedAt: expect.any(Date),
        },
      });

      expect(result).toEqual(mockCreatedInstructor);
    });

    it('should successfully create a new instructor with new price when price does not exist', async () => {
      // Arrange
      const newPrice = { id: 2, amount: 75, currency: 'EUR' };

      mockPrismaService.instructor.findFirst.mockResolvedValue(null);
      mockPrismaService.price.findFirst.mockResolvedValue(null);
      mockPrismaService.price.create.mockResolvedValue(newPrice);
      mockPrismaService.instructor.create.mockResolvedValue(
        mockCreatedInstructor,
      );

      const dtoWithNewPrice = { ...mockCreateInstructorDto, amount: 75 };

      // Act
      const result = await service.instructorSignup(dtoWithNewPrice);

      // Assert
      expect(mockPrismaService.price.findFirst).toHaveBeenCalledWith({
        where: {
          amount: 75,
          currency: 'EUR',
        },
      });

      expect(mockPrismaService.price.create).toHaveBeenCalledWith({
        data: {
          amount: 75,
          currency: 'EUR',
        },
      });

      expect(mockPrismaService.instructor.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            priceId: newPrice.id,
          }),
        }),
      );

      expect(result).toEqual(mockCreatedInstructor);
    });

    it('should handle instructor without profilePictureUrl', async () => {
      // Arrange
      const dtoWithoutProfilePicture = { ...mockCreateInstructorDto };
      delete dtoWithoutProfilePicture.profilePictureUrl;

      mockPrismaService.instructor.findFirst.mockResolvedValue(null);
      mockPrismaService.price.findFirst.mockResolvedValue(mockExistingPrice);
      mockPrismaService.instructor.create.mockResolvedValue(
        mockCreatedInstructor,
      );

      // Act
      await service.instructorSignup(dtoWithoutProfilePicture);

      // Assert
      expect(mockPrismaService.instructor.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            profilePictureUrl: null,
          }),
        }),
      );
    });

    it('should throw ConflictException when instructor with same email already exists', async () => {
      // Arrange
      const existingInstructor = {
        id: 1,
        email: mockCreateInstructorDto.email,
        siret: 'different-siret',
        iban: 'different-iban',
      };

      mockPrismaService.instructor.findFirst.mockResolvedValue(
        existingInstructor,
      );

      // Act & Assert
      await expect(
        service.instructorSignup(mockCreateInstructorDto),
      ).rejects.toThrow(
        new ConflictException('An instructor with this email already exists'),
      );

      expect(mockPrismaService.instructor.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when instructor with same SIRET already exists', async () => {
      // Arrange
      const existingInstructor = {
        id: 1,
        email: 'different@example.com',
        siret: mockCreateInstructorDto.siret,
        iban: 'different-iban',
      };

      mockPrismaService.instructor.findFirst.mockResolvedValue(
        existingInstructor,
      );

      // Act & Assert
      await expect(
        service.instructorSignup(mockCreateInstructorDto),
      ).rejects.toThrow(
        new ConflictException('An instructor with this SIRET already exists'),
      );

      expect(mockPrismaService.instructor.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when instructor with same IBAN already exists', async () => {
      // Arrange
      const existingInstructor = {
        id: 1,
        email: 'different@example.com',
        siret: 'different-siret',
        iban: mockCreateInstructorDto.iban,
      };

      mockPrismaService.instructor.findFirst.mockResolvedValue(
        existingInstructor,
      );

      // Act & Assert
      await expect(
        service.instructorSignup(mockCreateInstructorDto),
      ).rejects.toThrow(
        new ConflictException('An instructor with this IBAN already exists'),
      );

      expect(mockPrismaService.instructor.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      mockPrismaService.instructor.findFirst.mockResolvedValue(null);
      mockPrismaService.price.findFirst.mockResolvedValue(mockExistingPrice);
      mockPrismaService.instructor.create.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(
        service.instructorSignup(mockCreateInstructorDto),
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle argon hashing errors gracefully', async () => {
      // Arrange
      mockPrismaService.instructor.findFirst.mockResolvedValue(null);
      mockedArgon.hash.mockRejectedValue(new Error('Hashing failed'));

      // Act & Assert
      await expect(
        service.instructorSignup(mockCreateInstructorDto),
      ).rejects.toThrow('Hashing failed');

      expect(mockPrismaService.instructor.create).not.toHaveBeenCalled();
    });

    it('should handle price creation errors gracefully', async () => {
      // Arrange
      mockPrismaService.instructor.findFirst.mockResolvedValue(null);
      mockPrismaService.price.findFirst.mockResolvedValue(null);
      mockPrismaService.price.create.mockRejectedValue(
        new Error('Price creation failed'),
      );

      // Act & Assert
      await expect(
        service.instructorSignup(mockCreateInstructorDto),
      ).rejects.toThrow('Price creation failed');

      expect(mockPrismaService.instructor.create).not.toHaveBeenCalled();
    });

    it('should properly format dates when creating instructor', async () => {
      // Arrange
      const fixedDate = new Date('2023-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => fixedDate);

      mockPrismaService.instructor.findFirst.mockResolvedValue(null);
      mockPrismaService.price.findFirst.mockResolvedValue(mockExistingPrice);
      mockPrismaService.instructor.create.mockResolvedValue(
        mockCreatedInstructor,
      );

      // Act
      await service.instructorSignup(mockCreateInstructorDto);

      // Assert
      expect(mockPrismaService.instructor.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            createdAt: fixedDate,
            updatedAt: fixedDate,
          }),
        }),
      );

      // Restore Date
      const dateSpy = jest
        .spyOn(global, 'Date')
        .mockImplementation(() => fixedDate);
      dateSpy.mockRestore();
    });
  });
});
