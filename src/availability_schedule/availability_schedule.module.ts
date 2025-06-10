import { Module } from '@nestjs/common';
import { AvailabilityScheduleService } from './availability_schedule.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleValidationModule } from '../schedule_validation/schedule_validation.module';

@Module({
  imports: [PrismaModule, ScheduleValidationModule],
  providers: [AvailabilityScheduleService],
  exports: [AvailabilityScheduleService],
})
export class AvailabilityScheduleModule {}
