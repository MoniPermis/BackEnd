import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { InstructorsService } from '../instructors/instructors.service';
import {
  AuthenticatedInstructor,
  AuthenticatedStudent,
  AuthUserDto,
  CreateInstructorDto,
  CreateStudentDto,
} from './dto';
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
  let mockJwtService: {
    signAsync: jest.Mock;
  };
  let mockInstructorsService: {
    createDeletedInstructor: jest.Mock;
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

    mockJwtService = {
      signAsync: jest.fn(),
    };

    mockInstructorsService = {
      createDeletedInstructor: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: InstructorsService,
          useValue: mockInstructorsService,
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

describe('AuthService - studentSignup', () => {
  let service: AuthService;
  let mockPrismaService: {
    student: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
  };
  let mockJwtService: {
    signAsync: jest.Mock;
  };
  let mockInstructorsService: {
    createDeletedInstructor: jest.Mock;
  };

  const mockCreateStudentDto: CreateStudentDto = {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    phoneNumber: '+33123456789',
    profilePictureUrl: 'https://example.com/profile.jpg',
  };

  const mockCreatedStudent = {
    id: 1,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'hashedPassword',
    phoneNumber: '+33123456789',
    profilePictureUrl: 'https://example.com/profile.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockPrismaService = {
      student: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    mockJwtService = {
      signAsync: jest.fn(),
    };

    mockInstructorsService = {
      createDeletedInstructor: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: InstructorsService,
          useValue: mockInstructorsService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
    mockedArgon.hash.mockResolvedValue('hashedPassword');
  });

  describe('studentSignup', () => {
    it('should successfully create a new student with all fields', async () => {
      // Arrange
      mockPrismaService.student.findFirst.mockResolvedValue(null);
      mockPrismaService.student.create.mockResolvedValue(mockCreatedStudent);

      // Act
      const result = await service.studentSignup(mockCreateStudentDto);

      // Assert
      expect(mockPrismaService.student.findFirst).toHaveBeenCalledWith({
        where: { email: mockCreateStudentDto.email },
      });

      expect(mockedArgon.hash).toHaveBeenCalledWith(
        mockCreateStudentDto.password,
      );

      expect(mockPrismaService.student.create).toHaveBeenCalledWith({
        data: {
          firstName: mockCreateStudentDto.firstName,
          lastName: mockCreateStudentDto.lastName,
          email: mockCreateStudentDto.email,
          password: 'hashedPassword',
          phoneNumber: mockCreateStudentDto.phoneNumber,
          profilePictureUrl: mockCreateStudentDto.profilePictureUrl,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          createdAt: expect.any(Date),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          updatedAt: expect.any(Date),
        },
      });

      expect(result).toEqual(mockCreatedStudent);
    });

    it('should successfully create a new student without profilePictureUrl', async () => {
      // Arrange
      const dtoWithoutProfilePicture = { ...mockCreateStudentDto };
      delete dtoWithoutProfilePicture.profilePictureUrl;

      const expectedCreatedStudent = {
        ...mockCreatedStudent,
        profilePictureUrl: null,
      };

      mockPrismaService.student.findFirst.mockResolvedValue(null);
      mockPrismaService.student.create.mockResolvedValue(
        expectedCreatedStudent,
      );

      // Act
      const result = await service.studentSignup(dtoWithoutProfilePicture);

      // Assert
      expect(mockPrismaService.student.create).toHaveBeenCalledWith({
        data: {
          firstName: dtoWithoutProfilePicture.firstName,
          lastName: dtoWithoutProfilePicture.lastName,
          email: dtoWithoutProfilePicture.email,
          password: 'hashedPassword',
          phoneNumber: dtoWithoutProfilePicture.phoneNumber,
          profilePictureUrl: null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          createdAt: expect.any(Date),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          updatedAt: expect.any(Date),
        },
      });

      expect(result).toEqual(expectedCreatedStudent);
    });

    it('should throw ConflictException when student with same email already exists', async () => {
      // Arrange
      const existingStudent = {
        id: 2,
        email: mockCreateStudentDto.email,
        firstName: 'Different',
        lastName: 'Student',
      };

      mockPrismaService.student.findFirst.mockResolvedValue(existingStudent);

      // Act & Assert
      await expect(service.studentSignup(mockCreateStudentDto)).rejects.toThrow(
        new ConflictException('A student with this email already exists'),
      );

      expect(mockPrismaService.student.findFirst).toHaveBeenCalledWith({
        where: { email: mockCreateStudentDto.email },
      });

      expect(mockedArgon.hash).not.toHaveBeenCalled();
      expect(mockPrismaService.student.create).not.toHaveBeenCalled();
    });

    it('should handle argon hashing errors gracefully', async () => {
      // Arrange
      mockPrismaService.student.findFirst.mockResolvedValue(null);
      mockedArgon.hash.mockRejectedValue(new Error('Hashing failed'));

      // Act & Assert
      await expect(service.studentSignup(mockCreateStudentDto)).rejects.toThrow(
        'Hashing failed',
      );

      expect(mockPrismaService.student.findFirst).toHaveBeenCalledWith({
        where: { email: mockCreateStudentDto.email },
      });

      expect(mockedArgon.hash).toHaveBeenCalledWith(
        mockCreateStudentDto.password,
      );
      expect(mockPrismaService.student.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during student creation gracefully', async () => {
      // Arrange
      mockPrismaService.student.findFirst.mockResolvedValue(null);
      mockPrismaService.student.create.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(service.studentSignup(mockCreateStudentDto)).rejects.toThrow(
        'Database connection failed',
      );

      expect(mockPrismaService.student.findFirst).toHaveBeenCalledWith({
        where: { email: mockCreateStudentDto.email },
      });

      expect(mockedArgon.hash).toHaveBeenCalledWith(
        mockCreateStudentDto.password,
      );
      expect(mockPrismaService.student.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            email: mockCreateStudentDto.email,
            password: 'hashedPassword',
          }),
        }),
      );
    });

    it('should handle database errors during email check gracefully', async () => {
      // Arrange
      mockPrismaService.student.findFirst.mockRejectedValue(
        new Error('Database query failed'),
      );

      // Act & Assert
      await expect(service.studentSignup(mockCreateStudentDto)).rejects.toThrow(
        'Database query failed',
      );

      expect(mockPrismaService.student.findFirst).toHaveBeenCalledWith({
        where: { email: mockCreateStudentDto.email },
      });

      expect(mockedArgon.hash).not.toHaveBeenCalled();
      expect(mockPrismaService.student.create).not.toHaveBeenCalled();
    });

    it('should properly format dates when creating student', async () => {
      // Arrange
      const fixedDate = new Date('2023-01-01T00:00:00.000Z');
      const dateSpy = jest
        .spyOn(global, 'Date')
        .mockImplementation(() => fixedDate);

      mockPrismaService.student.findFirst.mockResolvedValue(null);
      mockPrismaService.student.create.mockResolvedValue(mockCreatedStudent);

      // Act
      await service.studentSignup(mockCreateStudentDto);

      // Assert
      expect(mockPrismaService.student.create).toHaveBeenCalledWith({
        data: {
          firstName: mockCreateStudentDto.firstName,
          lastName: mockCreateStudentDto.lastName,
          email: mockCreateStudentDto.email,
          password: 'hashedPassword',
          phoneNumber: mockCreateStudentDto.phoneNumber,
          profilePictureUrl: mockCreateStudentDto.profilePictureUrl,
          createdAt: fixedDate,
          updatedAt: fixedDate,
        },
      });

      // Restore Date
      dateSpy.mockRestore();
    });

    it('should handle empty string profilePictureUrl', async () => {
      // Arrange
      const dtoWithEmptyProfilePicture = {
        ...mockCreateStudentDto,
        profilePictureUrl: '',
      };

      mockPrismaService.student.findFirst.mockResolvedValue(null);
      mockPrismaService.student.create.mockResolvedValue(mockCreatedStudent);

      // Act
      await service.studentSignup(dtoWithEmptyProfilePicture);

      // Assert
      expect(mockPrismaService.student.create).toHaveBeenCalledWith({
        data: {
          firstName: dtoWithEmptyProfilePicture.firstName,
          lastName: dtoWithEmptyProfilePicture.lastName,
          email: dtoWithEmptyProfilePicture.email,
          password: 'hashedPassword',
          phoneNumber: dtoWithEmptyProfilePicture.phoneNumber,
          profilePictureUrl: null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          createdAt: expect.any(Date),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should verify password is hashed before storing', async () => {
      // Arrange
      const plainPassword = 'mySecretPassword';
      const hashedPassword = 'hashedSecretPassword';
      const studentDto = { ...mockCreateStudentDto, password: plainPassword };

      mockPrismaService.student.findFirst.mockResolvedValue(null);
      mockPrismaService.student.create.mockResolvedValue(mockCreatedStudent);
      mockedArgon.hash.mockResolvedValue(hashedPassword);

      // Act
      await service.studentSignup(studentDto);

      // Assert
      expect(mockedArgon.hash).toHaveBeenCalledWith(plainPassword);
      expect(mockPrismaService.student.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            password: hashedPassword,
          }),
        }),
      );

      // Verify the plain password is not stored
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const createCall = mockPrismaService.student.create.mock.calls[0][0];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createCall.data.password).not.toBe(plainPassword);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(createCall.data.password).toBe(hashedPassword);
    });

    it('should handle case-sensitive email uniqueness', async () => {
      // Arrange
      const upperCaseEmailDto = {
        ...mockCreateStudentDto,
        email: mockCreateStudentDto.email.toUpperCase(),
      };

      mockPrismaService.student.findFirst.mockResolvedValue(null);
      mockPrismaService.student.create.mockResolvedValue(mockCreatedStudent);

      // Act
      await service.studentSignup(upperCaseEmailDto);

      // Assert
      expect(mockPrismaService.student.findFirst).toHaveBeenCalledWith({
        where: { email: upperCaseEmailDto.email },
      });

      expect(mockPrismaService.student.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            email: upperCaseEmailDto.email,
          }),
        }),
      );
    });
  });
});

describe('AuthService - login and signToken', () => {
  let service: AuthService;
  let mockPrismaService: {
    instructor: {
      findUnique: jest.Mock;
    };
    student: {
      findUnique: jest.Mock;
    };
  };
  let mockJwtService: {
    signAsync: jest.Mock;
  };
  let mockInstructorsService: {
    createDeletedInstructor: jest.Mock;
  };

  const mockAuthUserDto: AuthUserDto = {
    email: 'test@example.com',
    password: 'password123',
    userType: 'instructor',
  };

  const mockInstructor = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
  };

  const mockStudent = {
    id: 2,
    email: 'student@example.com',
    password: 'hashedPassword',
  };

  beforeEach(async () => {
    mockPrismaService = {
      instructor: {
        findUnique: jest.fn(),
      },
      student: {
        findUnique: jest.fn(),
      },
    };

    mockJwtService = {
      signAsync: jest.fn(),
    };

    mockInstructorsService = {
      createDeletedInstructor: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: InstructorsService,
          useValue: mockInstructorsService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
    mockedArgon.verify.mockResolvedValue(true);
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('login', () => {
    it('should successfully authenticate an instructor', async () => {
      // Arrange
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      // Act
      const result = await service.login(mockAuthUserDto);

      // Assert
      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { email: mockAuthUserDto.email },
        select: { id: true, password: true, email: true },
      });
      expect(mockedArgon.verify).toHaveBeenCalledWith(
        mockInstructor.password,
        mockAuthUserDto.password,
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: mockInstructor.id,
          email: mockInstructor.email,
          userType: 'instructor',
        },
        {
          expiresIn: '15m',
          secret: 'test-secret',
        },
      );
      expect(result).toEqual({ access_token: 'jwt-token' });
    });

    it('should successfully authenticate a student', async () => {
      // Arrange
      const studentAuthDto: AuthUserDto = {
        ...mockAuthUserDto,
        userType: 'student' as const,
        email: 'student@example.com',
      };
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      // Act
      const result = await service.login(studentAuthDto);

      // Assert
      expect(mockPrismaService.student.findUnique).toHaveBeenCalledWith({
        where: { email: studentAuthDto.email },
        select: { id: true, password: true, email: true },
      });
      expect(mockedArgon.verify).toHaveBeenCalledWith(
        mockStudent.password,
        studentAuthDto.password,
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: mockStudent.id,
          email: mockStudent.email,
          userType: 'student',
        },
        {
          expiresIn: '15m',
          secret: 'test-secret',
        },
      );
      expect(result).toEqual({ access_token: 'jwt-token' });
    });

    it('should throw ConflictException when instructor is not found', async () => {
      // Arrange
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(mockAuthUserDto)).rejects.toThrow(
        new ConflictException('Invalid credentials'),
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when student is not found', async () => {
      // Arrange
      const studentAuthDto: AuthUserDto = {
        ...mockAuthUserDto,
        userType: 'student' as const,
      };
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(studentAuthDto)).rejects.toThrow(
        new ConflictException('Invalid credentials'),
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when password does not match', async () => {
      // Arrange
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockedArgon.verify.mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(mockAuthUserDto)).rejects.toThrow(
        new ConflictException('Invalid credentials'),
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when userType is invalid', async () => {
      // Arrange
      const invalidUserTypeDto = {
        ...mockAuthUserDto,
        userType: 'invalid' as 'instructor' | 'student',
      };

      // Act & Assert
      await expect(service.login(invalidUserTypeDto)).rejects.toThrow(
        new ConflictException('Invalid user type'),
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should handle argon verification errors gracefully', async () => {
      // Arrange
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockedArgon.verify.mockRejectedValue(new Error('Verification failed'));

      // Act & Assert
      await expect(service.login(mockAuthUserDto)).rejects.toThrow(
        'Verification failed',
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      mockPrismaService.instructor.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.login(mockAuthUserDto)).rejects.toThrow(
        'Database error',
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('signTokenAsync', () => {
    it('should sign a token for an instructor successfully', async () => {
      // Arrange
      mockJwtService.signAsync.mockResolvedValue('jwt-token');
      const id = 1;
      const email = 'test@example.com';
      const userType = 'instructor';

      // Act
      const result = await service.signTokenAsync(id, email, userType);

      // Assert
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: id,
          email,
          userType,
        },
        {
          expiresIn: '15m',
          secret: 'test-secret',
        },
      );
      expect(result).toEqual({ access_token: 'jwt-token' });
    });

    it('should sign a token for a student successfully', async () => {
      // Arrange
      mockJwtService.signAsync.mockResolvedValue('jwt-token');
      const id = 2;
      const email = 'student@example.com';
      const userType = 'student';

      // Act
      const result = await service.signTokenAsync(id, email, userType);

      // Assert
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: id,
          email,
          userType,
        },
        {
          expiresIn: '15m',
          secret: 'test-secret',
        },
      );
      expect(result).toEqual({ access_token: 'jwt-token' });
    });

    it('should handle JWT signing errors gracefully', async () => {
      // Arrange
      mockJwtService.signAsync.mockRejectedValue(
        new Error('JWT signing failed'),
      );

      // Act & Assert
      await expect(
        service.signTokenAsync(1, 'test@example.com', 'instructor'),
      ).rejects.toThrow('JWT signing failed');
    });

    it('should use environment variable for JWT secret', async () => {
      // Arrange
      process.env.JWT_SECRET = 'custom-secret';
      mockJwtService.signAsync.mockResolvedValue('jwt-token');

      // Act
      await service.signTokenAsync(1, 'test@example.com', 'instructor');

      // Assert
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          secret: 'custom-secret',
        }),
      );
    });
  });
});

describe('AuthService - deleteUser', () => {
  let service: AuthService;
  let prismaService: any;
  let instructorsService: any;

  const mockInstructor: AuthenticatedInstructor = {
    id: 1,
    priceId: 1,
    firstName: 'John',
    lastName: 'Doe',
    gender: 'Male',
    email: 'john.doe@example.com',
    phoneNumber: '123456789',
    address: '123 Main St',
    siret: '12345678901234',
    driverLicenceUrl: 'http://example.com/licence',
    registrationCertificateUrl: 'http://example.com/registration',
    insuranceCertificateUrl: 'http://example.com/insurance',
    degreeUrl: 'http://example.com/degree',
    teachingAuthorizationUrl: 'http://example.com/teaching',
    profilePictureUrl: 'http://example.com/profile.jpg',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    iban: 'FR1420041010050500013M02606',
    bic: 'BNPAFRPPXXX',
  };

  const mockStudent: AuthenticatedStudent = {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phoneNumber: '987654321',
    neph: 123456789,
    creditCardId: 1,
    profilePictureUrl: 'http://example.com/jane-profile.jpg',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
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

  beforeEach(async () => {
    const mockPrismaService = {
      instructor: {
        delete: jest.fn(),
      },
      student: {
        delete: jest.fn(),
      },
      purchaseOrder: {
        updateMany: jest.fn(),
      },
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const mockInstructorsService = {
      createDeletedInstructor: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: InstructorsService,
          useValue: mockInstructorsService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    instructorsService = module.get<InstructorsService>(InstructorsService);
  });

  describe('deleteUser - Instructor', () => {
    it('should successfully delete an instructor', async () => {
      // Arrange
      const expectedDeletedInstructorDto = {
        originalInstructorId: mockInstructor.id,
        firstName: mockInstructor.firstName,
        lastName: mockInstructor.lastName,
        email: mockInstructor.email,
        siret: mockInstructor.siret,
        iban: mockInstructor.iban,
      };

      (
        instructorsService.createDeletedInstructor as jest.Mock
      ).mockResolvedValue(mockDeletedInstructor);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prismaService.purchaseOrder.updateMany as jest.Mock).mockResolvedValue({
        count: 2,
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (prismaService.instructor.delete as jest.Mock).mockResolvedValue(
        mockInstructor,
      );

      // Act
      const result = await service.deleteUser(mockInstructor);

      // Assert
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(instructorsService.createDeletedInstructor).toHaveBeenCalledWith(
        expectedDeletedInstructorDto,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(prismaService.purchaseOrder.updateMany).toHaveBeenCalledWith({
        where: { instructorId: mockInstructor.id },
        data: {
          instructorId: null,
          deletedInstructorId: mockDeletedInstructor.id,
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(prismaService.instructor.delete).toHaveBeenCalledWith({
        where: { id: mockInstructor.id },
      });

      expect(result).toEqual(mockInstructor);
    });

    it('should handle instructor deletion when createDeletedInstructor fails', async () => {
      // Arrange
      const error = new Error('Database error');

      (
        instructorsService.createDeletedInstructor as jest.Mock
      ).mockRejectedValue(error);

      // Act & Assert
      await expect(service.deleteUser(mockInstructor)).rejects.toThrow(error);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(instructorsService.createDeletedInstructor).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(prismaService.purchaseOrder.updateMany).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(prismaService.instructor.delete).not.toHaveBeenCalled();
    });

    it('should handle instructor deletion when purchaseOrder update fails', async () => {
      // Arrange
      const error = new Error('Database error');
      (
        instructorsService.createDeletedInstructor as jest.Mock
      ).mockResolvedValue(mockDeletedInstructor);
      (prismaService.purchaseOrder.updateMany as jest.Mock).mockRejectedValue(
        error,
      );

      // Act & Assert
      await expect(service.deleteUser(mockInstructor)).rejects.toThrow(error);
      expect(instructorsService.createDeletedInstructor).toHaveBeenCalled();
      expect(prismaService.purchaseOrder.updateMany).toHaveBeenCalled();
      expect(prismaService.instructor.delete).not.toHaveBeenCalled();
    });

    it('should handle instructor deletion when instructor delete fails', async () => {
      // Arrange
      const error = new Error('Database error');
      (
        instructorsService.createDeletedInstructor as jest.Mock
      ).mockResolvedValue(mockDeletedInstructor);
      (prismaService.purchaseOrder.updateMany as jest.Mock).mockResolvedValue({
        count: 0,
      });
      (prismaService.instructor.delete as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(service.deleteUser(mockInstructor)).rejects.toThrow(error);
      expect(instructorsService.createDeletedInstructor).toHaveBeenCalled();
      expect(prismaService.purchaseOrder.updateMany).toHaveBeenCalled();
      expect(prismaService.instructor.delete).toHaveBeenCalled();
    });
  });

  describe('deleteUser - Student', () => {
    it('should successfully delete a student', async () => {
      // Arrange
      (prismaService.student.delete as jest.Mock).mockResolvedValue(
        mockStudent,
      );

      // Act
      const result = await service.deleteUser(mockStudent);

      // Assert
      expect(prismaService.student.delete).toHaveBeenCalledWith({
        where: { id: mockStudent.id },
      });
      expect(result).toEqual(mockStudent);

      // Verify that instructor-specific methods are not called
      expect(instructorsService.createDeletedInstructor).not.toHaveBeenCalled();
      expect(prismaService.purchaseOrder.updateMany).not.toHaveBeenCalled();
    });

    it('should handle student deletion when delete fails', async () => {
      // Arrange
      const error = new Error('Database error');
      (prismaService.student.delete as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(service.deleteUser(mockStudent)).rejects.toThrow(error);
      expect(prismaService.student.delete).toHaveBeenCalledWith({
        where: { id: mockStudent.id },
      });
    });
  });

  describe('deleteUser - Invalid User Type', () => {
    it('should throw ConflictException for invalid user type', async () => {
      // Arrange
      const invalidUser = {
        id: 3,
        firstName: 'Invalid',
        lastName: 'User',
        email: 'invalid@example.com',
        // Missing both 'siret' (instructor) and 'neph' (student) properties
      } as any;

      // Act & Assert
      await expect(service.deleteUser(invalidUser)).rejects.toThrow(
        new ConflictException('Invalid user type'),
      );

      // Verify that no database operations are performed
      expect(instructorsService.createDeletedInstructor).not.toHaveBeenCalled();
      expect(prismaService.purchaseOrder.updateMany).not.toHaveBeenCalled();
      expect(prismaService.instructor.delete).not.toHaveBeenCalled();
      expect(prismaService.student.delete).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser - Edge Cases', () => {
    it('should handle instructor with no associated purchase orders', async () => {
      // Arrange
      (
        instructorsService.createDeletedInstructor as jest.Mock
      ).mockResolvedValue(mockDeletedInstructor);
      (prismaService.purchaseOrder.updateMany as jest.Mock).mockResolvedValue({
        count: 0,
      });
      (prismaService.instructor.delete as jest.Mock).mockResolvedValue(
        mockInstructor,
      );

      // Act
      const result = await service.deleteUser(mockInstructor);

      // Assert
      expect(prismaService.purchaseOrder.updateMany).toHaveBeenCalledWith({
        where: { instructorId: mockInstructor.id },
        data: {
          instructorId: null,
          deletedInstructorId: mockDeletedInstructor.id,
        },
      });
      expect(result).toEqual(mockInstructor);
    });

    it('should handle instructor with multiple associated purchase orders', async () => {
      // Arrange
      (
        instructorsService.createDeletedInstructor as jest.Mock
      ).mockResolvedValue(mockDeletedInstructor);
      (prismaService.purchaseOrder.updateMany as jest.Mock).mockResolvedValue({
        count: 5,
      });
      (prismaService.instructor.delete as jest.Mock).mockResolvedValue(
        mockInstructor,
      );

      // Act
      const result = await service.deleteUser(mockInstructor);

      // Assert
      expect(prismaService.purchaseOrder.updateMany).toHaveBeenCalledWith({
        where: { instructorId: mockInstructor.id },
        data: {
          instructorId: null,
          deletedInstructorId: mockDeletedInstructor.id,
        },
      });
      expect(result).toEqual(mockInstructor);
    });
  });
});
