import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto';
import { ScheduleValidationService } from '../schedule_validation/schedule_validation.service';
import { UpdateAppointmentDto } from './dto';

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

  async getAppointmentById(appointmentId: number) {
    const appointment = await this.prismaService.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        student: true,
        instructor: true,
        meetingPoint: true,
        payment: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(
        `Rendez-vous avec l'ID ${appointmentId} non trouvé`,
      );
    }

    return appointment;
  }

  async modifyAppointmentById(
    appointmentId: number,
    appointmentData: UpdateAppointmentDto,
  ) {
    const appointment = await this.prismaService.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException(
        `Rendez-vous avec l'ID ${appointmentId} non trouvé`,
      );
    }

    if (appointmentData.meetingPointId) {
      const newMeetingPoint = await this.prismaService.meetingPoint.findUnique({
        where: { id: appointmentData.meetingPointId },
      });

      if (!newMeetingPoint) {
        throw new NotFoundException(
          `Point de rencontre avec l'ID ${appointmentData.meetingPointId} non trouvé`,
        );
      }
    }

    if (appointmentData.startTime || appointmentData.endTime) {
      await this.scheduleValidation.checkAppointmentConflicts(
        appointment.instructorId,
        appointmentData.startTime
          ? new Date(appointmentData.startTime)
          : appointment.startTime,
        appointmentData.endTime
          ? new Date(appointmentData.endTime)
          : appointment.endTime,
        appointmentId,
      );
    }

    const updateData: Record<string, any> = {
      modifiedAt: new Date(),
      ...(appointmentData.meetingPointId !== undefined && {
        meetingPointId: appointmentData.meetingPointId,
      }),
      ...(appointmentData.startTime !== undefined && {
        startTime: new Date(appointmentData.startTime),
      }),
      ...(appointmentData.endTime !== undefined && {
        endTime: new Date(appointmentData.endTime),
      }),
      ...(appointmentData.status !== undefined && {
        status: appointmentData.status,
      }),
      ...(appointmentData.description !== undefined && {
        description: appointmentData.description,
      }),
    };

    return this.prismaService.appointment.update({
      where: { id: appointmentId },
      data: updateData,
    });
  }

  async deleteAppointmentById(appointmentId: number) {
    const appointment = await this.prismaService.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException(
        `Rendez-vous avec l'ID ${appointmentId} non trouvé`,
      );
    }

    return this.prismaService.appointment.delete({
      where: { id: appointmentId },
    });
  }
}
