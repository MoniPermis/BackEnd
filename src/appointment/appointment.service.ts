import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto';

@Injectable()
export class AppointmentService {
  constructor(private prismaService: PrismaService) {}

  async createAppointment(appointmentData: CreateAppointmentDto) {
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
      }
    });
  }
}
