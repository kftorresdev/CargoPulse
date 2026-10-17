import { Module } from '@nestjs/common';
import { ControlTowerController } from './control-tower.controller.js';
import { ControlTowerService } from './control-tower.service.js';

@Module({
  controllers: [ControlTowerController],
  providers: [ControlTowerService],
  exports: [ControlTowerService],
})
export class ControlTowerModule {}
