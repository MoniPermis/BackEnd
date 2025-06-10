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
import { CreateUnavailabilityDto } from '../unavailability/dto';
import { UnavailabilityService } from '../unavailability/unavailability.service';

@Controller('instructors')
export class InstructorsController {
  constructor(
    private readonly availabilityScheduleService: AvailabilityScheduleService,
    private readonly unavailabilityService: UnavailabilityService,
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
  ):Promise<void> {
    await this.availabilityScheduleService.deleteAvailability(
      instructorId,
      availabilityId,
    );
  }

  @Post(':instructorId/unavailability')
  async createUnavailability(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Body() unavailabilityDto: CreateUnavailabilityDto,
  ) {
    return this.unavailabilityService.createUnavailability(
      instructorId,
      unavailabilityDto,
    );
  }
}
