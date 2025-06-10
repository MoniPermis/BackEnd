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
}
