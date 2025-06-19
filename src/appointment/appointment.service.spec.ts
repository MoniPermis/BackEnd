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
      findMany: jest.fn(),
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

  describe('getAppointmentsByInstructorId', () => {
    const instructorId = 2;
    const mockInstructor = { id: 2, name: 'John Instructor' };

    const mockAppointments = [
      {
        id: 1,
        studentId: 1,
        instructorId: 2,
        meetingPointId: 3,
        paymentId: 1,
        startTime: new Date('2024-06-15T10:00:00.000Z'),
        endTime: new Date('2024-06-15T11:00:00.000Z'),
        status: 'CONFIRMED',
        description: 'First driving lesson',
        createdAt: new Date('2024-06-15T09:00:00.000Z'),
        modifiedAt: new Date('2024-06-15T09:00:00.000Z'),
        student: {
          id: 1,
          firstName: 'Jane',
          lastName: 'Student',
          email: 'jane@example.com',
        },
        meetingPoint: {
          id: 3,
          name: 'Main Street',
          longitude: 2.3522,
          latitude: 48.8566,
        },
        payment: {
          id: 1,
          studentId: 1,
          priceId: 1,
          datetime: new Date('2024-06-15T08:00:00.000Z'),
        },
      },
      {
        id: 2,
        studentId: 2,
        instructorId: 2,
        meetingPointId: 4,
        paymentId: null,
        startTime: new Date('2024-06-16T14:00:00.000Z'),
        endTime: new Date('2024-06-16T15:00:00.000Z'),
        status: 'PENDING',
        description: 'Second driving lesson',
        createdAt: new Date('2024-06-16T13:00:00.000Z'),
        modifiedAt: new Date('2024-06-16T13:00:00.000Z'),
        student: {
          id: 2,
          firstName: 'Bob',
          lastName: 'Student',
          email: 'bob@example.com',
        },
        meetingPoint: {
          id: 4,
          name: 'City Center',
          longitude: 2.3488,
          latitude: 48.8534,
        },
        payment: null,
      },
    ];

    beforeEach(() => {
      // Setup default successful responses
      mockPrismaService.instructor.findUnique.mockResolvedValue(mockInstructor);
      mockPrismaService.appointment.findMany.mockResolvedValue(
        mockAppointments,
      );
    });

    it('should successfully return appointments for a valid instructor', async () => {
      // Act
      const result = await service.getAppointmentsByInstructorId(instructorId);

      // Assert
      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        where: { instructorId },
        include: {
          student: true,
          meetingPoint: true,
          payment: true,
        },
        orderBy: { startTime: 'asc' },
      });
      expect(result).toEqual(mockAppointments);
    });

    it('should return empty array when instructor has no appointments', async () => {
      // Arrange
      mockPrismaService.appointment.findMany.mockResolvedValue([]);

      // Act
      const result = await service.getAppointmentsByInstructorId(instructorId);

      // Assert
      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        where: { instructorId },
        include: {
          student: true,
          meetingPoint: true,
          payment: true,
        },
        orderBy: { startTime: 'asc' },
      });
      expect(result).toEqual([]);
    });

    it('should throw NotFoundException when instructor is not found', async () => {
      // Arrange
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getAppointmentsByInstructorId(instructorId),
      ).rejects.toThrow(`Moniteur avec l'ID ${instructorId} non trouvé`);

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(mockPrismaService.appointment.findMany).not.toHaveBeenCalled();
    });

    it('should handle appointments with null payment correctly', async () => {
      // Arrange
      const appointmentsWithNullPayment = [
        {
          ...mockAppointments[0],
          paymentId: null,
          payment: null,
        },
      ];
      mockPrismaService.appointment.findMany.mockResolvedValue(
        appointmentsWithNullPayment,
      );

      // Act
      const result = await service.getAppointmentsByInstructorId(instructorId);

      // Assert
      expect(result).toEqual(appointmentsWithNullPayment);
      expect(result[0].payment).toBeNull();
    });

    it('should return appointments ordered by startTime ascending', async () => {
      // Arrange
      const unorderedAppointments = [
        {
          ...mockAppointments[1],
          startTime: new Date('2024-06-16T14:00:00.000Z'),
        },
        {
          ...mockAppointments[0],
          startTime: new Date('2024-06-15T10:00:00.000Z'),
        },
      ];
      mockPrismaService.appointment.findMany.mockResolvedValue(
        unorderedAppointments,
      );

      // Act
      const result = await service.getAppointmentsByInstructorId(instructorId);

      // Assert
      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        where: { instructorId },
        include: {
          student: true,
          meetingPoint: true,
          payment: true,
        },
        orderBy: { startTime: 'asc' },
      });
      expect(result).toEqual(unorderedAppointments);
    });

    it('should handle different appointment statuses correctly', async () => {
      // Arrange
      const appointmentsWithVariousStatuses = [
        {
          ...mockAppointments[0],
          status: 'CONFIRMED',
        },
        {
          ...mockAppointments[1],
          status: 'PENDING',
        },
        {
          ...mockAppointments[0],
          id: 3,
          status: 'CANCELLED',
        },
        {
          ...mockAppointments[0],
          id: 4,
          status: 'COMPLETED',
        },
      ];
      mockPrismaService.appointment.findMany.mockResolvedValue(
        appointmentsWithVariousStatuses,
      );

      // Act
      const result = await service.getAppointmentsByInstructorId(instructorId);

      // Assert
      expect(result).toEqual(appointmentsWithVariousStatuses);
      expect(result).toHaveLength(4);
      expect(result.map((a) => a.status)).toEqual([
        'CONFIRMED',
        'PENDING',
        'CANCELLED',
        'COMPLETED',
      ]);
    });

    it('should handle appointments with null description correctly', async () => {
      // Arrange
      const appointmentsWithNullDescription = [
        {
          ...mockAppointments[0],
          description: null,
        },
      ];
      mockPrismaService.appointment.findMany.mockResolvedValue(
        appointmentsWithNullDescription,
      );

      // Act
      const result = await service.getAppointmentsByInstructorId(instructorId);

      // Assert
      expect(result).toEqual(appointmentsWithNullDescription);
      expect(result[0].description).toBeNull();
    });

    it('should handle zero instructorId correctly', async () => {
      // Arrange
      const zeroInstructorId = 0;
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getAppointmentsByInstructorId(zeroInstructorId),
      ).rejects.toThrow(`Moniteur avec l'ID ${zeroInstructorId} non trouvé`);

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: zeroInstructorId },
      });
    });

    it('should handle negative instructorId correctly', async () => {
      // Arrange
      const negativeInstructorId = -1;
      mockPrismaService.instructor.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getAppointmentsByInstructorId(negativeInstructorId),
      ).rejects.toThrow(
        `Moniteur avec l'ID ${negativeInstructorId} non trouvé`,
      );

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: negativeInstructorId },
      });
    });

    it('should throw an error when Prisma findUnique fails', async () => {
      // Arrange
      const prismaError = new Error('Database connection failed');
      mockPrismaService.instructor.findUnique.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(
        service.getAppointmentsByInstructorId(instructorId),
      ).rejects.toThrow('Database connection failed');

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(mockPrismaService.appointment.findMany).not.toHaveBeenCalled();
    });

    it('should throw an error when Prisma findMany fails', async () => {
      // Arrange
      const prismaError = new Error('Database query failed');
      mockPrismaService.appointment.findMany.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(
        service.getAppointmentsByInstructorId(instructorId),
      ).rejects.toThrow('Database query failed');

      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: instructorId },
      });
      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        where: { instructorId },
        include: {
          student: true,
          meetingPoint: true,
          payment: true,
        },
        orderBy: { startTime: 'asc' },
      });
    });

    it('should include all required relations in the response', async () => {
      // Act
      const result = await service.getAppointmentsByInstructorId(instructorId);

      // Assert
      expect(result[0]).toHaveProperty('student');
      expect(result[0]).toHaveProperty('meetingPoint');
      expect(result[0]).toHaveProperty('payment');
      expect(result[0].student).toHaveProperty('firstName');
      expect(result[0].student).toHaveProperty('lastName');
      expect(result[0].student).toHaveProperty('email');
      expect(result[0].meetingPoint).toHaveProperty('name');
      expect(result[0].meetingPoint).toHaveProperty('longitude');
      expect(result[0].meetingPoint).toHaveProperty('latitude');
    });

    it('should handle large number of appointments efficiently', async () => {
      // Arrange
      const largeAppointmentsList = Array.from({ length: 100 }, (_, index) => ({
        ...mockAppointments[0],
        id: index + 1,
        startTime: new Date(
          `2024-06-${15 + (index % 15)}T${10 + (index % 8)}:00:00.000Z`,
        ),
      }));
      mockPrismaService.appointment.findMany.mockResolvedValue(
        largeAppointmentsList,
      );

      // Act
      const result = await service.getAppointmentsByInstructorId(instructorId);

      // Assert
      expect(result).toHaveLength(100);
      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledTimes(1);
    });

    it('should verify the correct instructor ID is used in the query', async () => {
      // Arrange
      const specificInstructorId = 999;
      mockPrismaService.instructor.findUnique.mockResolvedValue({
        id: specificInstructorId,
        name: 'Specific Instructor',
      });

      // Act
      await service.getAppointmentsByInstructorId(specificInstructorId);

      // Assert
      expect(mockPrismaService.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: specificInstructorId },
      });
      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith({
        where: { instructorId: specificInstructorId },
        include: {
          student: true,
          meetingPoint: true,
          payment: true,
        },
        orderBy: { startTime: 'asc' },
      });
    });
  });
});
