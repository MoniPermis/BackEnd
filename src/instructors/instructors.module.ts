import { Module } from '@nestjs/common';
import { InstructorsController } from './instructors.controller';
import { AvailabilityScheduleModule } from '../availability_schedule/availability_schedule.module';
import { UnavailabilityModule } from '../unavailability/unavailability.module';
import { MeetingPointsModule } from 'src/meeting_points/meeting_points.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { InstructorsService } from './instructors.service';
import { AppointmentModule } from '../appointment/appointment.module';

@Module({
  imports: [
    AvailabilityScheduleModule,
    UnavailabilityModule,
    MeetingPointsModule,
    PrismaModule,
    AppointmentModule,
  ],
  controllers: [InstructorsController],
  providers: [InstructorsService],
})
export class InstructorsModule {}
