import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';
import { UserJwTPayload } from '../dto';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: PrismaService;

  const mockPrismaService = {
    instructor: {
      findUnique: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    // Mock JWT_SECRET environment variable
    process.env.JWT_SECRET = 'test-jwt-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.JWT_SECRET;
  });

  describe('constructor', () => {
    it('should throw error when JWT_SECRET is not defined', () => {
      delete process.env.JWT_SECRET;

      expect(() => {
        new JwtStrategy(prismaService);
      }).toThrow('JWT_SECRET environment variable is not defined');
    });

    it('should initialize successfully with JWT_SECRET', () => {
      process.env.JWT_SECRET = 'test-secret';

      expect(() => {
        new JwtStrategy(prismaService);
      }).not.toThrow();
    });
  });

  describe('validate', () => {
    describe('instructor validation', () => {
      const instructorPayload: UserJwTPayload = {
        id: 1,
        email: 'instructor@test.com',
        userType: 'instructor',
      };

      const mockInstructor = {
        id: 1,
        priceId: 1,
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        email: 'instructor@test.com',
        phoneNumber: '1234567890',
        address: '123 Test St',
        password: 'hashedPassword123',
        siret: '12345678901234',
        driverLicenceUrl: 'http://example.com/license.pdf',
        registrationCertificateUrl: 'http://example.com/cert.pdf',
        insuranceCertificateUrl: 'http://example.com/insurance.pdf',
        degreeUrl: 'http://example.com/degree.pdf',
        teachingAuthorizationUrl: 'http://example.com/auth.pdf',
        profilePictureUrl: 'http://example.com/profile.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
        iban: 'FR1420041010050500013M02606',
        bic: 'CCBPFRPPVER',
      };

      it('should return instructor without password when instructor exists', async () => {
        mockPrismaService.instructor.findUnique.mockResolvedValue(
          mockInstructor,
        );

        const result = await strategy.validate(instructorPayload);

        expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
          where: {
            id: instructorPayload.id,
            email: instructorPayload.email,
          },
        });

        expect(result).toEqual({
          id: 1,
          priceId: 1,
          firstName: 'John',
          lastName: 'Doe',
          gender: 'male',
          email: 'instructor@test.com',
          phoneNumber: '1234567890',
          address: '123 Test St',
          siret: '12345678901234',
          driverLicenceUrl: 'http://example.com/license.pdf',
          registrationCertificateUrl: 'http://example.com/cert.pdf',
          insuranceCertificateUrl: 'http://example.com/insurance.pdf',
          degreeUrl: 'http://example.com/degree.pdf',
          teachingAuthorizationUrl: 'http://example.com/auth.pdf',
          profilePictureUrl: 'http://example.com/profile.jpg',
          createdAt: mockInstructor.createdAt,
          updatedAt: mockInstructor.updatedAt,
          iban: 'FR1420041010050500013M02606',
          bic: 'CCBPFRPPVER',
        });

        expect(result).not.toHaveProperty('password');
      });

      it('should throw NotFoundException when instructor does not exist', async () => {
        mockPrismaService.instructor.findUnique.mockResolvedValue(null);

        await expect(strategy.validate(instructorPayload)).rejects.toThrow(
          new NotFoundException('Instructor not found'),
        );

        expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
          where: {
            id: instructorPayload.id,
            email: instructorPayload.email,
          },
        });
      });
    });

    describe('student validation', () => {
      const studentPayload: UserJwTPayload = {
        id: 2,
        email: 'student@test.com',
        userType: 'student',
      };

      const mockStudent = {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'student@test.com',
        password: 'hashedPassword456',
        phoneNumber: '0987654321',
        neph: 123456789,
        creditCardId: 1,
        profilePictureUrl: 'http://example.com/student-profile.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      it('should return student without password when student exists', async () => {
        mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);

        const result = await strategy.validate(studentPayload);

        expect(mockPrismaService.student.findUnique).toHaveBeenCalledWith({
          where: {
            id: studentPayload.id,
            email: studentPayload.email,
          },
        });

        expect(result).toEqual({
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'student@test.com',
          phoneNumber: '0987654321',
          neph: 123456789,
          creditCardId: 1,
          profilePictureUrl: 'http://example.com/student-profile.jpg',
          createdAt: mockStudent.createdAt,
          updatedAt: mockStudent.updatedAt,
        });

        expect(result).not.toHaveProperty('password');
      });

      it('should throw NotFoundException when student does not exist', async () => {
        mockPrismaService.student.findUnique.mockResolvedValue(null);

        await expect(strategy.validate(studentPayload)).rejects.toThrow(
          new NotFoundException('Student not found'),
        );

        expect(mockPrismaService.student.findUnique).toHaveBeenCalledWith({
          where: {
            id: studentPayload.id,
            email: studentPayload.email,
          },
        });
      });
    });

    describe('invalid user type', () => {
      it('should throw NotFoundException for invalid user type', async () => {
        const invalidPayload = {
          id: 1,
          email: 'test@test.com',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          userType: 'admin' as any, // Invalid user type
        };

        await expect(strategy.validate(invalidPayload)).rejects.toThrow(
          new NotFoundException('User type not recognized'),
        );

        expect(mockPrismaService.instructor.findUnique).not.toHaveBeenCalled();
        expect(mockPrismaService.student.findUnique).not.toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('should handle instructor with null optional fields', async () => {
        const instructorPayload: UserJwTPayload = {
          id: 1,
          email: 'instructor@test.com',
          userType: 'instructor',
        };

        const mockInstructorWithNulls = {
          id: 1,
          priceId: 1,
          firstName: 'John',
          lastName: 'Doe',
          gender: 'male',
          email: 'instructor@test.com',
          phoneNumber: null,
          address: '123 Test St',
          password: 'hashedPassword123',
          siret: '12345678901234',
          driverLicenceUrl: 'http://example.com/license.pdf',
          registrationCertificateUrl: 'http://example.com/cert.pdf',
          insuranceCertificateUrl: 'http://example.com/insurance.pdf',
          degreeUrl: 'http://example.com/degree.pdf',
          teachingAuthorizationUrl: 'http://example.com/auth.pdf',
          profilePictureUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          iban: 'FR1420041010050500013M02606',
          bic: 'CCBPFRPPVER',
        };

        mockPrismaService.instructor.findUnique.mockResolvedValue(
          mockInstructorWithNulls,
        );

        const result = await strategy.validate(instructorPayload);

        // Type assertion to access instructor-specific properties
        const instructorResult = result as typeof mockInstructorWithNulls;
        expect(instructorResult.phoneNumber).toBeNull();
        expect(instructorResult.profilePictureUrl).toBeNull();
        expect(result).not.toHaveProperty('password');
      });

      it('should handle student with null optional fields', async () => {
        const studentPayload: UserJwTPayload = {
          id: 2,
          email: 'student@test.com',
          userType: 'student',
        };

        const mockStudentWithNulls = {
          id: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'student@test.com',
          password: 'hashedPassword456',
          phoneNumber: null,
          neph: null,
          creditCardId: null,
          profilePictureUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrismaService.student.findUnique.mockResolvedValue(
          mockStudentWithNulls,
        );

        const result = await strategy.validate(studentPayload);

        // Type assertion to access student-specific properties
        const studentResult = result as typeof mockStudentWithNulls;
        expect(studentResult.phoneNumber).toBeNull();
        expect(studentResult.neph).toBeNull();
        expect(studentResult.creditCardId).toBeNull();
        expect(studentResult.profilePictureUrl).toBeNull();
        expect(result).not.toHaveProperty('password');
      });
    });

    describe('database error handling', () => {
      it('should propagate database errors for instructor lookup', async () => {
        const instructorPayload: UserJwTPayload = {
          id: 1,
          email: 'instructor@test.com',
          userType: 'instructor',
        };

        const dbError = new Error('Database connection failed');
        mockPrismaService.instructor.findUnique.mockRejectedValue(dbError);

        await expect(strategy.validate(instructorPayload)).rejects.toThrow(
          dbError,
        );
      });

      it('should propagate database errors for student lookup', async () => {
        const studentPayload: UserJwTPayload = {
          id: 2,
          email: 'student@test.com',
          userType: 'student',
        };

        const dbError = new Error('Database connection failed');
        mockPrismaService.student.findUnique.mockRejectedValue(dbError);

        await expect(strategy.validate(studentPayload)).rejects.toThrow(
          dbError,
        );
      });
    });
  });
});
