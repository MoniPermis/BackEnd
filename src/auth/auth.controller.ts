import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AuthenticatedUser,
  AuthUserDto,
  CreateInstructorDto,
  CreateStudentDto,
} from './dto';
import { JwtGuard } from './guard';
import { GetUser } from './decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtGuard)
  @Get('me')
  getMe(@GetUser() user: AuthenticatedUser) {
    return user;
  }

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('me')
  deleteMe(@GetUser() user: AuthenticatedUser) {
    return this.authService.deleteUser(user);
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
