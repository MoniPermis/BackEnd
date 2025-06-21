import {
  Body,
  Controller, Delete,
  Get, HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  async createAppointment(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentService.createAppointment(createAppointmentDto);
  }

  @Get(':id')
  async getAppointmentById(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentService.getAppointmentById(id);
  }

  @Put(':id')
  async updateAppointment(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentService.modifyAppointmentById(
      id,
      updateAppointmentDto,
    );
  }

  @HttpCode(204)
  @Delete(':id')
  async deleteAppointment(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentService.deleteAppointmentById(id);
  }
}
