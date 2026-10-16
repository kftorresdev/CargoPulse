import { Module } from '@nestjs/common';
import { FreightAuditController } from './freight-audit.controller.js';
import { FreightAuditService } from './freight-audit.service.js';

@Module({
  controllers: [FreightAuditController],
  providers: [FreightAuditService],
  exports: [FreightAuditService],
})
export class FreightAuditModule {}
