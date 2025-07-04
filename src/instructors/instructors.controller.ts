import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Get,
  Put,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { AvailabilityScheduleService } from '../availability_schedule/availability_schedule.service';
import { CreateAvailabilityScheduleDto } from '../availability_schedule/dto';
import { CreateUnavailabilityDto } from '../unavailability/dto';
import { UnavailabilityService } from '../unavailability/unavailability.service';
import { MeetingPointsService } from 'src/meeting_points/meeting_points.service';
import { InstructorsService } from './instructors.service';
import { AppointmentService } from '../appointment/appointment.service';

@Controller('instructors')
export class InstructorsController {
  constructor(
    private readonly availabilityScheduleService: AvailabilityScheduleService,
    private readonly unavailabilityService: UnavailabilityService,
    private readonly meetingPointsService: MeetingPointsService,
    private readonly instructorsService: InstructorsService,
    private readonly appointmentService: AppointmentService,
  ) {}

  @Get(':instructorId')
  async getInstructorById(
    @Param('instructorId', ParseIntPipe) instructorId: number,
  ) {
    return await this.instructorsService.getInstructorById(instructorId);
  }

  @Get()
  async getAllInstructors() {
    return await this.instructorsService.getAllInstructors();
  }

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
  ): Promise<void> {
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

  @Get(':instructorId/unavailability')
  async getUnavailabilities(
    @Param('instructorId', ParseIntPipe) instructorId: number,
  ) {
    return this.unavailabilityService.getAllUnavailabilitiesByInstructorId(
      instructorId,
    );
  }

  @Put(':instructorId/unavailability/:unavailabilityId')
  async modifyUnavailability(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Param('unavailabilityId', ParseIntPipe) unavailabilityId: number,
    @Body() unavailabilityDto: CreateUnavailabilityDto,
  ) {
    return this.unavailabilityService.modifyUnavailability(
      instructorId,
      unavailabilityId,
      unavailabilityDto,
    );
  }

  @HttpCode(204)
  @Delete(':instructorId/unavailability/:unavailabilityId')
  async deleteUnavailability(
    @Param('instructorId', ParseIntPipe) instructorId: number,
    @Param('unavailabilityId', ParseIntPipe) unavailabilityId: number,
  ): Promise<void> {
    await this.unavailabilityService.deleteUnavailability(
      instructorId,
      unavailabilityId,
    );
  }

  @Get(':instructorId/meeting-points')
  async getMeetingPoints(
    @Param('instructorId', ParseIntPipe) instructorId: number,
  ) {
    return this.meetingPointsService.getMeetingPointsByInstructorId(
      instructorId,
    );
  }

  @Get(':instructorId/appointments')
  async getAppointmentsByInstructorId(
    @Param('instructorId', ParseIntPipe) instructorId: number,
  ) {
    return this.appointmentService.getAppointmentsByInstructorId(instructorId);
  }
}
