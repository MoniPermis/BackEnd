import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvailabilityScheduleDto } from './dto';
import { ScheduleValidationService } from '../schedule_validation/schedule_validation.service';

@Injectable()
export class AvailabilityScheduleService {
  constructor(private prisma: PrismaService, private scheduleValidation: ScheduleValidationService ) {}

  async createAvailability(instructorId: number, availabilityData: CreateAvailabilityScheduleDto) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: instructorId },
    });
    if (!instructor) {
      throw new NotFoundException(
        `Instructeur avec l'ID ${instructorId} non trouvé`,
      );
    }

    // Validation des dates de début et de fin
    const start = new Date(availabilityData.startDateTime);
    const end = new Date(availabilityData.endDateTime);
    this.scheduleValidation.validateDateRange(start, end);

    // Vérifier les conflits de planning
    await this.scheduleValidation.checkScheduleConflicts(instructorId, start, end);

    // Valider les dates d'expiration
    this.validateRecurrenceExpiry(availabilityData);

    return this.prisma.availabilitySchedule.create({
      data: {
        instructorId: instructorId,
        startDateTime: start,
        endDateTime: end,
        isRecurring: availabilityData.isRecurring,
        recurrenceRule: availabilityData.recurrenceRule
          ? (availabilityData.recurrenceRule as
              | 'DAILY'
              | 'WEEKLY'
              | 'MONTHLY'
              | 'YEARLY')
          : null,
        expiryDate: availabilityData.expiryDate
          ? new Date(availabilityData.expiryDate)
          : null,
        note: availabilityData.note ?? null,
      },
    });
  }

  async getAllAvailabilitiesByInstructorId(instructorId: number) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: instructorId },
    });
    if (!instructor) {
      throw new NotFoundException(
        `Instructeur avec l'ID ${instructorId} non trouvé`,
      );
    }
    return this.prisma.availabilitySchedule.findMany({
      where: { instructorId: instructorId },
      orderBy: { startDateTime: 'asc' },
    });
  }

  async modifyAvailability(
    instructorId: number,
    availabilityId: number,
    updateData: CreateAvailabilityScheduleDto,
  ) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: instructorId },
    });
    if (!instructor) {
      throw new NotFoundException(
        `Instructeur avec l'ID ${instructorId} non trouvé`,
      );
    }

    const availability = await this.prisma.availabilitySchedule.findUnique({
      where: { id: availabilityId },
    });
    if (!availability) {
      throw new NotFoundException(
        `Disponibilité avec l'ID ${availabilityId} non trouvée`,
      );
    }
    if (availability.instructorId !== instructorId) {
      throw new BadRequestException(
        `Cette disponibilité n'appartient pas à l'instructeur ${instructorId}`,
      );
    }

    this.validateRecurrenceExpiry(updateData);

    return this.prisma.availabilitySchedule.update({
      where: { id: availabilityId },
      data: {
        startDateTime: new Date(updateData.startDateTime),
        endDateTime: new Date(updateData.endDateTime),
        isRecurring: updateData.isRecurring,
        recurrenceRule: updateData.recurrenceRule
          ? (updateData.recurrenceRule as
              | 'DAILY'
              | 'WEEKLY'
              | 'MONTHLY'
              | 'YEARLY')
          : null,
        expiryDate: updateData.expiryDate
          ? new Date(updateData.expiryDate)
          : null,
        note: updateData.note ?? null,
      },
    });
  }

  async deleteAvailability(
    instructorId: number,
    availabilityId: number,
  ) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: instructorId },
    });
    if (!instructor) {
      throw new NotFoundException(
        `Instructeur avec l'ID ${instructorId} non trouvé`,
      );
    }

    const availability = await this.prisma.availabilitySchedule.findUnique({
      where: { id: availabilityId },
    });
    if (!availability) {
      throw new NotFoundException(
        `Disponibilité avec l'ID ${availabilityId} non trouvée`,
      );
    }
    if (availability.instructorId !== instructorId) {
      throw new BadRequestException(
        `Cette disponibilité n'appartient pas à l'instructeur ${instructorId}`,
      );
    }

    return this.prisma.availabilitySchedule.delete({
      where: { id: availabilityId },
    });
  }

  private validateRecurrenceExpiry(data: CreateAvailabilityScheduleDto): void {
    const start = new Date(data.startDateTime);
    const end = new Date(data.endDateTime);

    if (data.isRecurring && !data.recurrenceRule) {
      throw new BadRequestException(
        'La règle de récurrence est requise pour les disponibilités récurrentes',
      );
    }
    if (data.expiryDate && !data.isRecurring) {
      throw new BadRequestException(
        "La date d'expiration n'est pas applicable pour les disponibilités non récurrentes",
      );
    }
    if (data.expiryDate) {
      const expiry = new Date(data.expiryDate);
      if (expiry <= new Date()) {
        throw new BadRequestException(
          "La date d'expiration doit être postérieure à la date actuelle",
        );
      }
      if (data.isRecurring && (expiry <= start || expiry <= end)) {
        throw new BadRequestException(
          "La date d'expiration doit être postérieure aux dates de début et de fin",
        );
      }
    }
  }
}
