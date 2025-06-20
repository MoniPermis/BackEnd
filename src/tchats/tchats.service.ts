import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { tchatDto, messageDto } from './dto';

@Injectable()
export class TchatsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTchat(tchatDto: tchatDto) {
    let name: string;
    if (tchatDto.name) {
      name = tchatDto.name;
    } else {
      name = 'default chat name';
    }
    return await this.prisma.tchat.create({
      data: {
        name: name,
        studentId: tchatDto.studentId,
        instructorId: tchatDto.instructorId,
        createdAt: new Date(),
        lastMessageAt: new Date(),
      },
    });
  }

  async getTchatMessagesByTchatId(tchatId: number) {
    const chat = await this.prisma.tchat.findUnique({
      where: { id: tchatId },
    });
    if (!chat) {
      throw new NotFoundException('Tchat not found');
    }

    return await this.prisma.message.findUnique({
      where: { id: tchatId },
    });
  }

  async createMessage(tchatId: number, messageDto: messageDto) {
    const tchat = await this.prisma.tchat.findUnique({
      where: { id: tchatId },
    });
    if (!tchat) {
      throw new NotFoundException('Chat not found');
    }

    return await this.prisma.message.create({
      data: {
        content: messageDto.content,
        senderType: messageDto.senderType,
        tchatId: tchatId,
        isRead: false,
        sentAt: new Date(),
      },
    });
  }
}
