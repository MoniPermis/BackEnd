import { Module } from '@nestjs/common';
import { MeetingPointsController } from './meeting_points.controller';
import { MeetingPointsService } from './meeting_points.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MeetingPointsController],
  providers: [MeetingPointsService],
  exports: [MeetingPointsService],
})
export class MeetingPointsModule {}
