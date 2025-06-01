import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvailabilityScheduleDto } from './dto';

@Injectable()
export class AvailabilityScheduleService {
  constructor(private prisma: PrismaService) {}

  async createAvailability(instructorId: number, availabilityData: CreateAvailabilityScheduleDto) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: instructorId },
    });
    if (!instructor) {
      throw new NotFoundException(`Instructeur avec l'ID ${instructorId} non trouvé`);
    }
    this.validateAvailabilityTimes(availabilityData.startTime, availabilityData.endTime);
    return this.prisma.availabilitySchedule.create({
      data: {
        instructorId: instructorId,
        dayOfWeek: availabilityData.dayOfWeek,
        startTime: availabilityData.startTime,
        endTime: availabilityData.endTime,
        isRecurring: availabilityData.isRecurring,
        effectiveDate: availabilityData.effectiveDate,
        expiryDate: availabilityData.expiryDate,
        note: availabilityData.note
      },
    });
  }
  private validateAvailabilityTimes(startTime: string, endTime: string): void {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);

    if (start >= end) {
      throw new BadRequestException('L\'heure de fin doit être postérieure à l\'heure de début');
    }
  }
}
