import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { CrawlerModule } from '../crawler/crawler.module';

/**
 * Module quản lý health check
 */
@Module({
  imports: [CrawlerModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
