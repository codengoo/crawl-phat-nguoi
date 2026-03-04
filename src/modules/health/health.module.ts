import { Module } from '@nestjs/common';
import { PlateModule } from '../plate/plate.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * Module quản lý health check
 */
@Module({
  imports: [PlateModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
