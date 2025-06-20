import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TchatsService } from './tchats.service';
import { tchatDto, messageDto } from './dto';

@Controller('tchats')
export class TchatsController {
  constructor(private readonly chatsService: TchatsService) {}

  @Get(':tchatId/messages')
  async getTchatMessagesByTchatId(@Param('tchatId') tchatId: number) {
    return await this.chatsService.getTchatMessagesByTchatId(tchatId);
  }

  @Post()
  async createTchat(@Body() tchatDto: tchatDto) {
    return await this.chatsService.createTchat(tchatDto);
  }

  @Post(':tchatId/messages')
  async createMessage(
    @Param('tchatId') tchatId: number,
    @Body() messageDto: messageDto,
  ) {
    return await this.chatsService.createMessage(tchatId, messageDto);
  }
}
