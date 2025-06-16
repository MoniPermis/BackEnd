import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { InstructorsService } from './instructors.service';
import { NotFoundException } from '@nestjs/common';

describe('InstructorsService', () => {
  let service: InstructorsService;

  const mockPrisma = {
    instructor: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
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

  describe('getMeetingPointsByInstructorId', () => {
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

    it('should return meeting points if instructor exists', async () => {
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
});
