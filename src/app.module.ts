import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InstructorsModule } from './instructors/instructors.module';
import { AvailabilityScheduleModule } from './availability_schedule/availability_schedule.module';

@Module({
  imports: [InstructorsModule, AvailabilityScheduleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
