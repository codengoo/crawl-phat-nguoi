import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CrawlerModule } from './modules/crawler/crawler.module';
import { HealthModule } from './modules/health/health.module';

/**
 * Root application module
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CrawlerModule,
    HealthModule,
  ],
})
export class AppModule {}
