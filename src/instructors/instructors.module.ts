import { Module } from '@nestjs/common';
import { InstructorsController } from './instructors.controller';
import { AvailabilityScheduleModule } from '../availability_schedule/availability_schedule.module';

@Module({
  imports: [AvailabilityScheduleModule],
  controllers: [InstructorsController],
  providers: [],
})
export class InstructorsModule {}
