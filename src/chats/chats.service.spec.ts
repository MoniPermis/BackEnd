import { Test, TestingModule } from '@nestjs/testing';
import { ChatsService } from './chats.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('ChatsService', () => {
  let service: ChatsService;

  const mockPrisma = {}

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ChatsService>(ChatsService);

    jest.clearAllMocks();
  });
});