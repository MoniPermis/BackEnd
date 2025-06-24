import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateInstructorDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('instructor/signup')
  async signup(@Body() createInstructorDto: CreateInstructorDto) {
    return await this.authService.instructorSignup(createInstructorDto);
  }
}
