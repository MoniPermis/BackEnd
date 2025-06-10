import { Module } from '@nestjs/common';
import { ScheduleValidationService } from './schedule_validation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ScheduleValidationService],
  exports: [ScheduleValidationService],
})
export class ScheduleValidationModule {}
