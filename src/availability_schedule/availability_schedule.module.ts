import { Module } from '@nestjs/common';
import { AvailabilityScheduleService } from './availability_schedule.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AvailabilityScheduleService],
  exports: [AvailabilityScheduleService],
})
export class AvailabilityScheduleModule {}
