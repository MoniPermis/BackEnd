import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Get, Put, Delete, HttpCode,
} from '@nestjs/common';
import { AvailabilityScheduleService } from '../availability_schedule/availability_schedule.service';
import { CreateAvailabilityScheduleDto } from '../availability_schedule/dto';

@Controller('instructors')
export class InstructorsController {
  constructor(
    private readonly availabilityScheduleService: AvailabilityScheduleService,
  ) {}

  @Post(':instructorId/availability')
  async createAvailability(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Body() availabilityDto: CreateAvailabilityScheduleDto,
  ) {
    return this.availabilityScheduleService.createAvailability(
      instructorId,
      availabilityDto,
    );
  }

  @Get(':instructorId/availability')
  async getAvailabilities(
    @Param('instructorId', ParseIntPipe) instructorId: number,
  ) {
    return this.availabilityScheduleService.getAllAvailabilitiesByInstructorId(
      instructorId,
    );
  }

  @Put(':instructorId/availability/:availabilityId')
  async modifyAvailability(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Param('availabilityId', ParseIntPipe) availabilityId: number,
    @Body() availabilityDto: CreateAvailabilityScheduleDto,
  ) {
    return this.availabilityScheduleService.modifyAvailability(
      instructorId,
      availabilityId,
      availabilityDto,
    );
  }

  @HttpCode(204)
  @Delete(':instructorId/availability/:availabilityId')
  async deleteAvailability(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Param('availabilityId', ParseIntPipe) availabilityId: number,
  ) {
    return this.availabilityScheduleService.deleteAvailability(
      instructorId,
      availabilityId,
    );
  }
}
