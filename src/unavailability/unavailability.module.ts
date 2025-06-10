import { Module } from '@nestjs/common';
import { UnavailabilityService } from './unavailability.service';
import { ScheduleValidationModule } from '../schedule_validation/schedule_validation.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleValidationModule],
  providers: [UnavailabilityService],
  exports: [UnavailabilityService],
})
export class UnavailabilityModule {}
