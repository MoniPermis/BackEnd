import { Module } from '@nestjs/common';
import { InstructorsController } from './instructors.controller';
import { AvailabilityScheduleModule } from '../availability_schedule/availability_schedule.module';
import { UnavailabilityModule } from '../unavailability/unavailability.module';
import { MeetingPointsModule } from 'src/meeting_points/meeting_points.module';

@Module({
  imports: [
    AvailabilityScheduleModule,
    UnavailabilityModule,
    MeetingPointsModule,
  ],
  controllers: [InstructorsController],
  providers: [],
})
export class InstructorsModule {}
