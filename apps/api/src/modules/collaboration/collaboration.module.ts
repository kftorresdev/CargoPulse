import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { ShipmentsModule } from '../shipments/shipments.module.js';
import { CollaborationController } from './collaboration.controller.js';
import { CollaborationService } from './collaboration.service.js';

@Module({
  imports: [PrismaModule, AuthModule, ShipmentsModule],
  controllers: [CollaborationController],
  providers: [CollaborationService],
  exports: [CollaborationService],
})
export class CollaborationModule {}
