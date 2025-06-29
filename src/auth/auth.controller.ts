import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthUserDto, CreateInstructorDto, CreateStudentDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('instructor/signup')
  async signup(@Body() createInstructorDto: CreateInstructorDto) {
    return await this.authService.instructorSignup(createInstructorDto);
  }

  @Post('student/signup')
  async studentSignup(@Body() createStudentDto: CreateStudentDto) {
    return await this.authService.studentSignup(createStudentDto);
  }

  @Post('/login')
  async login(@Body() authUser: AuthUserDto) {
    return await this.authService.login(authUser);
  }
}
