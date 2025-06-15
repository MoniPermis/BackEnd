import { Test, TestingModule } from '@nestjs/testing';
import { MeetingPointsService } from './meeting_points.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import exp from 'constants';
import e from 'express';

describe('MeetingPointsService', () => {
  let service: MeetingPointsService;
  let prisma: PrismaService;

  const mockPrisma = {
    meetingPoint: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    instructor: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingPointsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<MeetingPointsService>(MeetingPointsService);

    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all meeting points', async () => {
      const fakedata = [
          {
              "id": 8,
              "instructorId": 1,
              "longitude": 0,
              "latitude": 0,
              "name": "string",
              "createdAt": "2025-06-15T00:00:00.000Z",
              "modifiedAt": "2025-06-15T00:00:00.000Z"
          },
          {
              "id": 9,
              "instructorId": 1,
              "longitude": 0,
              "latitude": 0,
              "name": "string",
              "createdAt": "2025-06-15T00:00:00.000Z",
              "modifiedAt": "2025-06-15T00:00:00.000Z"
          },
          {
              "id": 4,
              "instructorId": 1,
              "longitude": 0.66,
              "latitude": 0.88,
              "name": "strinnnnnng",
              "createdAt": "2025-06-15T00:00:00.000Z",
              "modifiedAt": "2025-06-15T00:00:00.000Z"
          },
          {
              "id": 6,
              "instructorId": 2,
              "longitude": 0,
              "latitude": 0,
              "name": "string",
              "createdAt": "2025-06-15T00:00:00.000Z",
              "modifiedAt": "2025-06-15T00:00:00.000Z"
          },
          {
              "id": 7,
              "instructorId": 2,
              "longitude": 0,
              "latitude": 0,
              "name": "string",
              "createdAt": "2025-06-15T00:00:00.000Z",
              "modifiedAt": "2025-06-15T00:00:00.000Z"
          }
      ]
      mockPrisma.meetingPoint.findMany.mockResolvedValue(fakedata);

      expect(await service.getAll()).toEqual(fakedata);
      expect(mockPrisma.meetingPoint.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should throw if instructor not found', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-06-15T00:00:00.000Z'));
      mockPrisma.instructor.findUnique.mockResolvedValue(null);

      const dto = {
        instructorId: 1,
        name: 'Point A',
        longitude: 1.1,
        latitude: 2.2,
      };
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.instructor.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: dto.instructorId },
      });
      expect(mockPrisma.meetingPoint.create).toHaveBeenCalledTimes(0);
    });

    it('should create a meeting point if instructor exists', async () => {
      const instructor = {
        id: 2,
        priceId: 2,
        firstName: "hugo",
        lastName: "boss",
        gender: "male",
        email: "user2@example.com",
        phoneNumber: "0909090909",
        address: "this is fake address",
        password: "password123",
        siret: "1235",
        driverLicenceUrl: "string",
        registrationCertificateUrl: "string",
        insuranceCertificateUrl: "string",
        degreeUrl: "string",
        teachingAuthorizationUrl: "string",
        profilePictureUrl: "",
        createdAt: "2025-06-15T00:00:00.000Z",
        updatedAt: "2025-06-15T00:00:00.000Z",
        iban: "12431",
        bic: "123"
      }
      mockPrisma.instructor.findUnique.mockResolvedValue(instructor);
      const meetingPoint = {
        id: 1,
        instructorId: 1,
        name: 'Point A',
        longitude: 1.1,
        latitude: 2.2,
        createdAt: new Date(),
        modifiedAt: new Date(),
      };
      mockPrisma.meetingPoint.create.mockResolvedValue(meetingPoint);

      const dto = {
        instructorId: 1,
        name: 'Point A',
        longitude: 1.1,
        latitude: 2.2,
      };
      const result = await service.create(dto);

      expect(result).toEqual(meetingPoint);
      expect(mockPrisma.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: dto.instructorId },
      });
      expect(mockPrisma.instructor.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.meetingPoint.create).toHaveBeenCalledWith({
        data: {
          instructorId: dto.instructorId,
          name: dto.name,
          longitude: dto.longitude,
          latitude: dto.latitude,
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      });
      expect(mockPrisma.meetingPoint.create).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });
  });

  describe('modify', () => {
    it('should throw if meeting point not found', async () => {
      mockPrisma.meetingPoint.findUnique.mockResolvedValue(null);

      const dto = {
        instructorId: 1,
        name: 'New Name',
        longitude: 1.1,
        latitude: 2.2,
      };
      const param = 1;

      await expect(service.modify(param, dto)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.meetingPoint.findUnique).toHaveBeenCalledWith({
        where: { id: param },
      });
      expect(mockPrisma.meetingPoint.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.meetingPoint.update).toHaveBeenCalledTimes(0);
    });

    it('should update meeting point if found', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-06-15T00:00:00.000Z'));
      const meetingPoint = {
        id: 1,
        instructorId: 1,
        name: 'Old Name',
        longitude: 1.1,
        latitude: 2.2,
        createdAt: expect.any(Date),
        modifiedAt: expect.any(Date),
      };
      mockPrisma.meetingPoint.findUnique.mockResolvedValue(meetingPoint);
      const updated ={
        id: 1,
        instructorId: 1,
        name: 'New Name',
        longitude: 1.1,
        latitude: 2.2,
        createdAt: new Date(),
        modifiedAt: expect.any(Date),
      };
      mockPrisma.meetingPoint.update.mockResolvedValue(updated);

      const dto = {
        instructorId: 1,
        name: 'New Name',
        longitude: 1.1,
        latitude: 2.2,
      };
      const param = 1;
      const result = await service.modify(param, dto);

      expect(result).toEqual(updated);
      expect(mockPrisma.meetingPoint.findUnique).toHaveBeenCalledWith({
        where: { id:  param },
      });
      expect(mockPrisma.meetingPoint.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.meetingPoint.update).toHaveBeenCalledWith({
        where: { id: meetingPoint.id },
        data: {
          name: dto.name,
          longitude: dto.longitude,
          latitude: dto.latitude,
          modifiedAt: new Date(),
        },
      });
      expect(mockPrisma.meetingPoint.update).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });
  });

  describe('delete', () => {
    it('should throw if meeting point not found', async () => {
      const param = 1;
      mockPrisma.meetingPoint.findUnique.mockResolvedValue(null);
      await expect(service.delete(param)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.meetingPoint.findUnique).toHaveBeenCalledWith({
        where: { id: param },
      });
      expect(mockPrisma.meetingPoint.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.meetingPoint.delete).toHaveBeenCalledTimes(0);
    });

    it('should delete meeting point if found', async () => {
      const param = 1;
      const meetingPoint = {
        id: 1,
        instructorId: 1,
        name: 'Old Name',
        longitude: 1.1,
        latitude: 2.2,
        createdAt: expect.any(Date),
        modifiedAt: expect.any(Date),
      };
      mockPrisma.meetingPoint.findUnique.mockResolvedValue(meetingPoint);
      mockPrisma.meetingPoint.delete.mockResolvedValue(undefined);

      const result = await service.delete(param);

      expect(result).toBeUndefined();
      expect(mockPrisma.meetingPoint.findUnique).toHaveBeenCalledWith({
        where: { id: param },
      });
      expect(mockPrisma.meetingPoint.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.meetingPoint.delete).toHaveBeenCalledWith({
        where: { id: meetingPoint.id },
      });
      expect(mockPrisma.meetingPoint.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMeetingPointsByInstructorId', () => {
    it('should throw if instructor not found', async () => {
      const param = 1;
      mockPrisma.instructor.findUnique.mockResolvedValue(null);
      await expect(service.getMeetingPointsByInstructorId(param)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: param },
      });
      expect(mockPrisma.instructor.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.meetingPoint.findMany).toHaveBeenCalledTimes(0);
    });

    it('should return meeting points if instructor exists', async () => {
      const param = 2;
      const instructor = {
        id: 2,
        priceId: 2,
        firstName: "hugo",
        lastName: "boss",
        gender: "male",
        email: "user2@example.com",
        phoneNumber: "0909090909",
        address: "this is fake address",
        password: "password123",
        siret: "1235",
        driverLicenceUrl: "string",
        registrationCertificateUrl: "string",
        insuranceCertificateUrl: "string",
        degreeUrl: "string",
        teachingAuthorizationUrl: "string",
        profilePictureUrl: "",
        createdAt: "2025-06-15T00:00:00.000Z",
        updatedAt: "2025-06-15T00:00:00.000Z",
        iban: "12431",
        bic: "123"
      }
      mockPrisma.instructor.findUnique.mockResolvedValue(instructor);
      const fakedata = [
          {
              "id": 6,
              "instructorId": 2,
              "longitude": 0,
              "latitude": 0,
              "name": "string",
              "createdAt": "2025-06-15T00:00:00.000Z",
              "modifiedAt": "2025-06-15T00:00:00.000Z"
          },
          {
              "id": 7,
              "instructorId": 2,
              "longitude": 0,
              "latitude": 0,
              "name": "string",
              "createdAt": "2025-06-15T00:00:00.000Z",
              "modifiedAt": "2025-06-15T00:00:00.000Z"
          }
      ]
      mockPrisma.meetingPoint.findMany.mockResolvedValue(fakedata);

      const result = await service.getMeetingPointsByInstructorId(param);

      expect(result).toEqual(fakedata);
      expect(mockPrisma.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: param },
      });
      expect(mockPrisma.instructor.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.meetingPoint.findMany).toHaveBeenCalledWith({
        where: { instructorId: instructor.id },
      });
      expect(mockPrisma.meetingPoint.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
