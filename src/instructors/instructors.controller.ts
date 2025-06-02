import { Controller, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { AvailabilityScheduleService } from '../availability_schedule/availability_schedule.service';
import { CreateAvailabilityScheduleDto } from '../availability_schedule/dto';

@Controller('instructors')
export class InstructorsController {
  constructor(private readonly availabilityScheduleService: AvailabilityScheduleService) {}

  @Post(':instructorId/availability')
  async createAvailability(@Param('instructorId', ParseIntPipe) instructorId: number, @Body() availabilityDto: CreateAvailabilityScheduleDto) {
    return this.availabilityScheduleService.createAvailability(instructorId, availabilityDto);
  }
}
