import { Module } from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { ScheduleValidationModule } from '../schedule_validation/schedule_validation.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ScheduleValidationModule, PrismaModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
