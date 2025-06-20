import { Module } from '@nestjs/common';
import { TchatsController } from './tchats.controller';
import { TchatsService } from './tchats.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TchatsController],
  providers: [TchatsService],
})
export class TchatsModule {}
