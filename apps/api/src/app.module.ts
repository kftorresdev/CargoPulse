import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './database/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ShipmentsModule } from './modules/shipments/shipments.module.js';
import { CollaborationModule } from './modules/collaboration/collaboration.module.js';
import { FreightAuditModule } from './modules/freight-audit/freight-audit.module.js';
import { AlertCenterModule } from './modules/alert-center/alert-center.module.js';
import { ControlTowerModule } from './modules/control-tower/control-tower.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ShipmentsModule,
    CollaborationModule,
    FreightAuditModule,
    AlertCenterModule,
    ControlTowerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

