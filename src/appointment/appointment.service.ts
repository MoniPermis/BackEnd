import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto';
import { ScheduleValidationService } from '../schedule_validation/schedule_validation.service';

@Injectable()
export class AppointmentService {
  constructor(
    private prismaService: PrismaService,
    private scheduleValidation: ScheduleValidationService,
  ) {}

  async createAppointment(appointmentData: CreateAppointmentDto) {
    const instructor = await this.prismaService.instructor.findUnique({
      where: { id: appointmentData.instructorId },
    });
    if (!instructor) {
      throw new NotFoundException(
        `Moniteur avec l'ID ${appointmentData.instructorId} non trouvé`,
      );
    }

    const student = await this.prismaService.student.findUnique({
      where: { id: appointmentData.studentId },
    });
    if (!student) {
      throw new Error(
        `Étudiant avec l'ID ${appointmentData.studentId} non trouvé`,
      );
    }

    const meetingPoint = await this.prismaService.meetingPoint.findUnique({
      where: { id: appointmentData.meetingPointId },
    });
    if (!meetingPoint) {
      throw new Error(
        `Point de rencontre avec l'ID ${appointmentData.meetingPointId} non trouvé`,
      );
    }

    await this.scheduleValidation.checkAppointmentConflicts(
      appointmentData.instructorId,
      new Date(appointmentData.startTime),
      new Date(appointmentData.endTime),
      undefined,
    );

    return this.prismaService.appointment.create({
      data: {
        studentId: appointmentData.studentId,
        instructorId: appointmentData.instructorId,
        meetingPointId: appointmentData.meetingPointId,
        startTime: new Date(appointmentData.startTime),
        endTime: new Date(appointmentData.endTime),
        description: appointmentData.description || null,
        createdAt: new Date(),
        modifiedAt: new Date(),
      },
    });
  }

  async getAppointmentsByInstructorId(instructorId: number) {
    const instructor = await this.prismaService.instructor.findUnique({
      where: { id: instructorId },
    });
    if (!instructor) {
      throw new NotFoundException(
        `Moniteur avec l'ID ${instructorId} non trouvé`,
      );
    }

    return this.prismaService.appointment.findMany({
      where: { instructorId },
      include: {
        student: true,
        meetingPoint: true,
        payment: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }
}
