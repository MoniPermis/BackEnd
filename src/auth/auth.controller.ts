import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticatedUser, AuthUserDto, CreateInstructorDto, CreateStudentDto } from './dto';
import { JwtGuard } from './guard';
import { GetUser } from './decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtGuard)
  @Get('me')
  async getMe(@GetUser() user: AuthenticatedUser) {
    return user;
  }

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
