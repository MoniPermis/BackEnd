import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnavailabilityDto } from './dto';
import { ScheduleValidationService } from '../schedule_validation/schedule_validation.service';

@Injectable()
export class UnavailabilityService {
  constructor(
    private prisma: PrismaService,
    private scheduleValidation: ScheduleValidationService,
  ) {}

  async createUnavailability(
    instructorId: number,
    unavailabilityData: CreateUnavailabilityDto,
  ) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: instructorId },
    });
    if (!instructor) {
      throw new NotFoundException(
        `Instructeur avec l'ID ${instructorId} non trouvé`,
      );
    }

    const start = new Date(unavailabilityData.startDateTime);
    const end = new Date(unavailabilityData.endDateTime);

    this.scheduleValidation.validateDateRange(start, end);
    await this.scheduleValidation.checkScheduleConflicts(
      instructorId,
      start,
      end,
    );

    return this.prisma.instructorUnavailability.create({
      data: {
        instructorId,
        startDateTime: new Date(unavailabilityData.startDateTime),
        endDateTime: new Date(unavailabilityData.endDateTime),
        reason: unavailabilityData.reason,
      },
    });
  }

  async getAllUnavailabilitiesByInstructorId(instructorId: number) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: instructorId },
    });
    if (!instructor) {
      throw new NotFoundException(
        `Instructeur avec l'ID ${instructorId} non trouvé`,
      );
    }

    return this.prisma.instructorUnavailability.findMany({
      where: { instructorId },
      orderBy: { startDateTime: 'asc' },
    });
  }

  async modifyUnavailability(
    instructorId: number,
    unavailabilityId: number,
    unavailabilityData: CreateUnavailabilityDto,
  ) {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id: instructorId },
    });
    if (!instructor) {
      throw new NotFoundException(
        `Instructeur avec l'ID ${instructorId} non trouvé`,
      );
    }

    const unavailability =
      await this.prisma.instructorUnavailability.findUnique({
        where: { id: unavailabilityId },
      });
    if (!unavailability) {
      throw new NotFoundException(
        `Indisponibilité avec l'ID ${unavailabilityId} non trouvée`,
      );
    }
    if (unavailability.instructorId !== instructorId) {
      throw new NotFoundException(
        `Indisponibilité avec l'ID ${unavailabilityId} n'appartient pas à l'instructeur avec l'ID ${instructorId}`,
      );
    }

    const start = new Date(unavailabilityData.startDateTime);
    const end = new Date(unavailabilityData.endDateTime);

    this.scheduleValidation.validateDateRange(start, end);
    await this.scheduleValidation.checkScheduleConflictsForUpdate(
      instructorId,
      start,
      end,
      undefined,
      unavailabilityId,
    );

    return this.prisma.instructorUnavailability.update({
      where: { id: unavailabilityId },
      data: {
        startDateTime: start,
        endDateTime: end,
        reason: unavailabilityData.reason,
      },
    });
  }
}
