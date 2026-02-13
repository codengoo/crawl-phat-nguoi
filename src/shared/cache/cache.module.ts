import { Module, OnModuleInit } from '@nestjs/common';
import { CacheService } from './cache.service';

@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule implements OnModuleInit {
  constructor(private readonly cacheService: CacheService) {}
  
  /**
   * Thiết lập cleanup job khi module được khởi tạo
   * Chạy cleanup mỗi 10 phút để giải phóng memory
   */
  onModuleInit() {
    // Cleanup mỗi 10 phút
    setInterval(() => {
      this.cacheService.cleanup();
    }, 10 * 60 * 1000);
  }
}
