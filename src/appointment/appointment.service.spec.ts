import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from './appointment.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleValidationService } from '../schedule_validation/schedule_validation.service';
import { CreateAppointmentDto } from './dto';

describe('AppointmentService', () => {
  let service: AppointmentService;

  const mockPrismaService = {
    appointment: {
      create: jest.fn(),
    },
    instructor: {
      findUnique: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
    },
    meetingPoint: {
      findUnique: jest.fn(),
    },
  };

  const mockScheduleValidationService = {
    checkAppointmentConflicts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
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

    service = module.get<AppointmentService>(AppointmentService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAppointment', () => {
    const mockCreateAppointmentDto: CreateAppointmentDto = {
      studentId: 1,
      instructorId: 2,
      meetingPointId: 3,
      startTime: '2024-06-15T10:00:00.000Z',
      endTime: '2024-06-15T11:00:00.000Z',
      description: 'Driving lesson',
    };

    const mockCreatedAppointment = {
      id: 1,
      studentId: 1,
      instructorId: 2,
      meetingPointId: 3,
      paymentId: null,
      startTime: new Date('2024-06-15T10:00:00.000Z'),
      endTime: new Date('2024-06-15T11:00:00.000Z'),
      status: 'PENDING',
      description: 'Driving lesson',
      createdAt: new Date('2024-06-15T09:00:00.000Z'),
      modifiedAt: new Date('2024-06-15T09:00:00.000Z'),
    };

    const mockInstructor = { id: 2, name: 'John Instructor' };
    const mockStudent = { id: 1, name: 'Jane Student' };
    const mockMeetingPoint = { id: 3, name: 'Main Street' };

    beforeEach(() => {
      // Setup default successful responses
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.meetingPoint.findUnique.mockResolvedValue(
        mockMeetingPoint,
      );
      mockScheduleValidationService.checkAppointmentConflicts.mockResolvedValue(
        undefined,
      );
    });

    it('should successfully create an appointment with all fields', async () => {
      // Arrange
      mockPrismaService.appointment.create.mockResolvedValue(
        mockCreatedAppointment,
      );

      // Act
      const result = await service.createAppointment(mockCreateAppointmentDto);

      // Assert
      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: mockCreateAppointmentDto.instructorId },
      });
      expect(mockPrismaService.student.findUnique).toHaveBeenCalledWith({
        where: { id: mockCreateAppointmentDto.studentId },
      });
      expect(mockPrismaService.meetingPoint.findUnique).toHaveBeenCalledWith({
        where: { id: mockCreateAppointmentDto.meetingPointId },
      });
      expect(
        mockScheduleValidationService.checkAppointmentConflicts,
      ).toHaveBeenCalledWith(
        mockCreateAppointmentDto.instructorId,
        new Date(mockCreateAppointmentDto.startTime),
        new Date(mockCreateAppointmentDto.endTime),
        undefined,
      );
      expect(mockPrismaService.appointment.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.appointment.create).toHaveBeenCalledWith({
        data: {
          studentId: mockCreateAppointmentDto.studentId,
          instructorId: mockCreateAppointmentDto.instructorId,
          meetingPointId: mockCreateAppointmentDto.meetingPointId,
          startTime: new Date(mockCreateAppointmentDto.startTime),
          endTime: new Date(mockCreateAppointmentDto.endTime),
          description: mockCreateAppointmentDto.description,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          createdAt: expect.any(Date),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          modifiedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockCreatedAppointment);
    });

    it('should create an appointment without description (optional field)', async () => {
      // Arrange
      const dtoWithoutDescription: CreateAppointmentDto = {
        studentId: 1,
        instructorId: 2,
        meetingPointId: 3,
        startTime: '2024-06-15T10:00:00.000Z',
        endTime: '2024-06-15T11:00:00.000Z',
      };

      const mockCreatedAppointmentWithoutDescription = {
        ...mockCreatedAppointment,
        description: null,
      };

      mockPrismaService.appointment.create.mockResolvedValue(
        mockCreatedAppointmentWithoutDescription,
      );

      // Act
      const result = await service.createAppointment(dtoWithoutDescription);

      // Assert
      expect(mockPrismaService.appointment.create).toHaveBeenCalledWith({
        data: {
          studentId: dtoWithoutDescription.studentId,
          instructorId: dtoWithoutDescription.instructorId,
          meetingPointId: dtoWithoutDescription.meetingPointId,
          startTime: new Date(dtoWithoutDescription.startTime),
          endTime: new Date(dtoWithoutDescription.endTime),
          description: null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          createdAt: expect.any(Date),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          modifiedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockCreatedAppointmentWithoutDescription);
    });

    it('should throw an error when instructor is not found', async () => {
      // Arrange
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createAppointment(mockCreateAppointmentDto),
      ).rejects.toThrow(
        `Moniteur avec l'ID ${mockCreateAppointmentDto.instructorId} non trouvé`,
      );

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: mockCreateAppointmentDto.instructorId },
      });
      expect(mockPrismaService.appointment.create).not.toHaveBeenCalled();
    });

    it('should throw an error when student is not found', async () => {
      // Arrange
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createAppointment(mockCreateAppointmentDto),
      ).rejects.toThrow(
        `Étudiant avec l'ID ${mockCreateAppointmentDto.studentId} non trouvé`,
      );

      expect(mockPrismaService.student.findUnique).toHaveBeenCalledWith({
        where: { id: mockCreateAppointmentDto.studentId },
      });
      expect(mockPrismaService.appointment.create).not.toHaveBeenCalled();
    });

    it('should throw an error when meeting point is not found', async () => {
      // Arrange
      mockPrismaService.meetingPoint.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createAppointment(mockCreateAppointmentDto),
      ).rejects.toThrow(
        `Point de rencontre avec l'ID ${mockCreateAppointmentDto.meetingPointId} non trouvé`,
      );

      expect(mockPrismaService.meetingPoint.findUnique).toHaveBeenCalledWith({
        where: { id: mockCreateAppointmentDto.meetingPointId },
      });
      expect(mockPrismaService.appointment.create).not.toHaveBeenCalled();
    });

    it('should throw an error when schedule validation fails', async () => {
      // Arrange
      const scheduleError = new Error('Schedule conflict detected');
      mockScheduleValidationService.checkAppointmentConflicts.mockRejectedValue(
        scheduleError,
      );

      // Act & Assert
      await expect(
        service.createAppointment(mockCreateAppointmentDto),
      ).rejects.toThrow('Schedule conflict detected');

      expect(
        mockScheduleValidationService.checkAppointmentConflicts,
      ).toHaveBeenCalledWith(
        mockCreateAppointmentDto.instructorId,
        new Date(mockCreateAppointmentDto.startTime),
        new Date(mockCreateAppointmentDto.endTime),
        undefined,
      );
      expect(mockPrismaService.appointment.create).not.toHaveBeenCalled();
    });

    it('should handle empty string description as empty string (not null)', async () => {
      // Arrange
      const dtoWithEmptyDescription: CreateAppointmentDto = {
        studentId: 1,
        instructorId: 2,
        meetingPointId: 3,
        startTime: '2024-06-15T10:00:00.000Z',
        endTime: '2024-06-15T11:00:00.000Z',
        description: '',
      };

      mockPrismaService.appointment.create.mockResolvedValue(
        mockCreatedAppointment,
      );

      // Act
      await service.createAppointment(dtoWithEmptyDescription);

      // Assert
      expect(mockPrismaService.appointment.create).toHaveBeenCalledWith({
        data: {
          studentId: dtoWithEmptyDescription.studentId,
          instructorId: dtoWithEmptyDescription.instructorId,
          meetingPointId: dtoWithEmptyDescription.meetingPointId,
          startTime: new Date(dtoWithEmptyDescription.startTime),
          endTime: new Date(dtoWithEmptyDescription.endTime),
          description: null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          createdAt: expect.any(Date),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          modifiedAt: expect.any(Date),
        },
      });
    });

    it('should correctly convert string dates to Date objects', async () => {
      // Arrange
      const testStartTime = '2024-12-25T14:30:00.000Z';
      const testEndTime = '2024-12-25T15:30:00.000Z';

      const dtoWithSpecificDates: CreateAppointmentDto = {
        studentId: 1,
        instructorId: 2,
        meetingPointId: 3,
        startTime: testStartTime,
        endTime: testEndTime,
        description: 'Christmas lesson',
      };

      mockPrismaService.appointment.create.mockResolvedValue(
        mockCreatedAppointment,
      );

      // Act
      await service.createAppointment(dtoWithSpecificDates);

      // Assert
      const expectedStartTime = new Date(testStartTime);
      const expectedEndTime = new Date(testEndTime);

      expect(mockPrismaService.appointment.create).toHaveBeenCalledWith({
        data: {
          studentId: dtoWithSpecificDates.studentId,
          instructorId: dtoWithSpecificDates.instructorId,
          meetingPointId: dtoWithSpecificDates.meetingPointId,
          startTime: expectedStartTime,
          endTime: expectedEndTime,
          description: dtoWithSpecificDates.description,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          createdAt: expect.any(Date),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          modifiedAt: expect.any(Date),
        },
      });
    });

    it('should throw an error when Prisma create fails', async () => {
      // Arrange
      const prismaError = new Error('Database connection failed');
      mockPrismaService.appointment.create.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(
        service.createAppointment(mockCreateAppointmentDto),
      ).rejects.toThrow('Database connection failed');

      expect(mockPrismaService.appointment.create).toHaveBeenCalledTimes(1);
    });

    it('should set createdAt and modifiedAt to current time', async () => {
      // Arrange
      const beforeCall = new Date();
      mockPrismaService.appointment.create.mockResolvedValue(
        mockCreatedAppointment,
      );

      // Act
      await service.createAppointment(mockCreateAppointmentDto);
      const afterCall = new Date();

      // Assert

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const calledWith = mockPrismaService.appointment.create.mock.calls[0][0];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const createdAt = calledWith.data.createdAt;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const modifiedAt = calledWith.data.modifiedAt;

      expect(createdAt).toBeInstanceOf(Date);
      expect(modifiedAt).toBeInstanceOf(Date);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCall.getTime());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      expect(modifiedAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      expect(modifiedAt.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    it('should handle invalid date strings gracefully', async () => {
      // Arrange
      const dtoWithInvalidDate: CreateAppointmentDto = {
        studentId: 1,
        instructorId: 2,
        meetingPointId: 3,
        startTime: 'invalid-date',
        endTime: '2024-06-15T11:00:00.000Z',
        description: 'Test appointment',
      };

      mockPrismaService.appointment.create.mockResolvedValue(
        mockCreatedAppointment,
      );

      // Act
      await service.createAppointment(dtoWithInvalidDate);

      // Assert
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const calledWith = mockPrismaService.appointment.create.mock.calls[0][0];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(calledWith.data.startTime).toBeInstanceOf(Date);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
      expect(isNaN(calledWith.data.startTime.getTime())).toBe(true); // Invalid Date
    });

    it('should handle Prisma unique constraint violation', async () => {
      // Arrange
      const uniqueConstraintError = new Error('Unique constraint failed');
      // Add proper error code for Prisma unique constraint
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (uniqueConstraintError as any).code = 'P2002';
      mockPrismaService.appointment.create.mockRejectedValue(
        uniqueConstraintError,
      );

      // Act & Assert
      await expect(
        service.createAppointment(mockCreateAppointmentDto),
      ).rejects.toThrow('Unique constraint failed');
    });
  });
});
