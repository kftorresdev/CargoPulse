import { Module } from '@nestjs/common';
import { AlertCenterController } from './alert-center.controller.js';
import { AlertCenterService } from './alert-center.service.js';

@Module({
  controllers: [AlertCenterController],
  providers: [AlertCenterService],
  exports: [AlertCenterService],
})
export class AlertCenterModule {}
