import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InstructorsModule } from './instructors/instructors.module';
import { ScheduleValidationModule } from './schedule_validation/schedule_validation.module';

@Module({
  imports: [InstructorsModule, ScheduleValidationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
