import { Module } from '@nestjs/common';
import { InstructorsController } from './instructors.controller';
import { AvailabilityScheduleModule } from '../availability_schedule/availability_schedule.module';
import { UnavailabilityModule } from '../unavailability/unavailability.module';

@Module({
  imports: [AvailabilityScheduleModule, UnavailabilityModule],
  controllers: [InstructorsController],
  providers: [],
})
export class InstructorsModule {}
