import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}
}