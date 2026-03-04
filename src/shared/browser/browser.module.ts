import { Module } from '@nestjs/common';
import { BrowserManagerService } from './browser-manager.service';
import { ProxyService } from './proxy.service';

@Module({
  providers: [BrowserManagerService, ProxyService],
  exports: [BrowserManagerService, ProxyService],
})
export class BrowserModule {}
