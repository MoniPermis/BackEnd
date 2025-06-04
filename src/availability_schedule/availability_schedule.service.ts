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

    const start = new Date(availabilityData.startDateTime);
    const end = new Date(availabilityData.endDateTime);
    if (start >= end) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début');
    }
    if (availabilityData.isRecurring && !availabilityData.recurrenceRule) {
      throw new BadRequestException('La règle de récurrence est requise pour les disponibilités récurrentes');
    }
    if (availabilityData.expiryDate && !availabilityData.isRecurring) {
      throw new BadRequestException('La date d\'expiration n\'est pas applicable pour les disponibilités non récurrentes');
    }
    if (availabilityData.expiryDate && new Date(availabilityData.expiryDate) <= new Date()) {
      throw new BadRequestException('La date d\'expiration doit être postérieure à la date actuelle');
    }
    if (availabilityData.isRecurring && availabilityData.expiryDate && new Date(availabilityData.expiryDate) <= start) {
      throw new BadRequestException('La date d\'expiration doit être postérieure à la date de début pour les disponibilités récurrentes');
    }
    if (availabilityData.isRecurring && availabilityData.expiryDate && new Date(availabilityData.expiryDate) <= end) {
      throw new BadRequestException('La date d\'expiration doit être postérieure à la date de fin pour les disponibilités récurrentes');
    }
    return this.prisma.availabilitySchedule.create({
      data: {
        instructorId: instructorId,
        startDateTime: start,
        endDateTime: end,
        isRecurring: availabilityData.isRecurring,
        recurrenceRule: availabilityData.recurrenceRule
          ? (availabilityData.recurrenceRule as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY')
          : null,
        expiryDate: availabilityData.expiryDate ? new Date(availabilityData.expiryDate) : null,
        note: availabilityData.note ?? null,
      },
    });
  }

  async getAllAvailabilitiesByInstructorId(instructorId: number) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: instructorId },
    });
    if (!instructor) {
      throw new NotFoundException(`Instructeur avec l'ID ${instructorId} non trouvé`);
    }
    return this.prisma.availabilitySchedule.findMany({
      where: { instructorId: instructorId },
      orderBy: { startDateTime: 'asc' },
    });
  }
}
