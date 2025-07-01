import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { AuthenticatedUser } from '../auth/dto';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  async createAppointment(@Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentService.createAppointment(createAppointmentDto);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  getMyAppointments(@GetUser() user: AuthenticatedUser) {
    return this.appointmentService.getAppointmentsByUser(user);
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
