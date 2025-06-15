import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  ParseIntPipe,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { CreateMeetingPointDto } from './dto/';
import { MeetingPointsService } from './meeting_points.service';

@Controller('meeting-points')
export class MeetingPointsController {
  constructor(private readonly meetingPointService: MeetingPointsService) {}

  @Get()
  async getMeetingPoints() {
    return await this.meetingPointService.getAll();
  }

  @Post()
  async createMeetingPoint(
    @Body() createMeetingPointDto: CreateMeetingPointDto,
  ) {
    return await this.meetingPointService.create(createMeetingPointDto);
  }

  @Put(':id')
  async modifyMeetingPoint(
    @Param('id', ParseIntPipe) id: number,
    @Body() createMeetingPointDto: CreateMeetingPointDto,
  ) {
    return await this.meetingPointService.modify(id, createMeetingPointDto);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteMeetingPoint(@Param('id', ParseIntPipe) id: number) {
    return await this.meetingPointService.delete(id);
  }
}
