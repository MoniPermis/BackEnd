import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InstructorsModule } from './instructors/instructors.module';
import { ScheduleValidationModule } from './schedule_validation/schedule_validation.module';
import { AppointmentService } from './appointment/appointment.service';
import { AppointmentModule } from './appointment/appointment.module';

@Module({
  imports: [InstructorsModule, ScheduleValidationModule, AppointmentModule],
  controllers: [AppController],
  providers: [AppService, AppointmentService],
})
export class AppModule {}
