import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMeetingPointDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeetingPointsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    return await this.prisma.meetingPoint.findMany();
  }

  async create(createMeetingPointDto: CreateMeetingPointDto) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: createMeetingPointDto.instructorId },
    });
    if (!instructor) {
      throw new NotFoundException('Instructeur non trouvé');
    }

    return await this.prisma.meetingPoint.create({
      data: {
        instructorId: createMeetingPointDto.instructorId,
        name: createMeetingPointDto.name,
        longitude: createMeetingPointDto.longitude,
        latitude: createMeetingPointDto.latitude,
        createdAt: new Date(),
        modifiedAt: new Date(),
      },
    });
  }

  async modify(id: number, createMeetingPointDto: CreateMeetingPointDto) {
    const meetingPoint = await this.prisma.meetingPoint.findUnique({
      where: { id: id },
    });
    if (!meetingPoint) {
      throw new NotFoundException('Point de rencontre non trouvé');
    }

    return await this.prisma.meetingPoint.update({
      where: { id: meetingPoint.id },
      data: {
        name: createMeetingPointDto.name,
        longitude: createMeetingPointDto.longitude,
        latitude: createMeetingPointDto.latitude,
        modifiedAt: new Date(),
      },
    });
  }

  async delete(id: number) {
    const meetingPoint = await this.prisma.meetingPoint.findUnique({
      where: { id: id },
    });
    if (!meetingPoint) {
      throw new NotFoundException('Point de rencontre non trouvé');
    }

    await this.prisma.meetingPoint.delete({
      where: { id: meetingPoint.id },
    });
  }

  async getMeetingPointsByInstructorId(instructorId: number) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: instructorId },
    });
    if (!instructor) {
      throw new NotFoundException('Instructeur non trouvé');
    }

    return await this.prisma.meetingPoint.findMany({
      where: { instructorId: instructor.id },
    });
  }
}
