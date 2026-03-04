import { Module } from '@nestjs/common';
import { BrowserModule } from '../../shared/browser/browser.module';
import { CacheModule } from '../../shared/cache/cache.module';
import { PlateController } from './plate.controller';
import { PlateService } from './plate.service';

@Module({
  imports: [CacheModule, BrowserModule],
  controllers: [PlateController],
  providers: [PlateService],
  exports: [PlateService],
})
export class PlateModule {}
