import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { PlateModule } from './modules/plate/plate.module';

/**
 * Root application module
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PlateModule,
    HealthModule,
  ],
})
export class AppModule {}
