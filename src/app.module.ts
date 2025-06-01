import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AvailabilityScheduleService } from './availability_schedule/availability_schedule.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, AvailabilityScheduleService],
})
export class AppModule {}
