import { Module } from '@nestjs/common';
import { InstructorsService } from './instructors.service';
import { InstructorsController } from './instructors.controller';
import { AvailabilityScheduleModule } from '../availability_schedule/availability_schedule.module';

@Module({
  imports: [AvailabilityScheduleModule],
  controllers: [InstructorsController],
  providers: [InstructorsService],
})
export class InstructorsModule {}
