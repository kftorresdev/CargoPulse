import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  public isConnected: boolean = false;

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Prisma connected to PostgreSQL database successfully.');
    } catch (error) {
      this.isConnected = false;
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Unable to connect to database at ${process.env.DATABASE_URL || 'localhost:5432'} (${detail}). Database operations will require active connection.`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.isConnected = false;
  }
}
