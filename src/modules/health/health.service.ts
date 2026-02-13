import { Injectable, Logger } from '@nestjs/common';
import { CrawlerService } from '../crawler/crawler.service';

/**
 * Service kiểm tra health của ứng dụng
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly crawlerService: CrawlerService) {}

  /**
   * Kiểm tra trạng thái tổng thể của service
   */
  async checkHealth(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    browser: {
      status: string;
      healthy: boolean;
    };
  }> {
    const browserHealthy = await this.crawlerService.isHealthy();

    return {
      status: browserHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      browser: {
        status: browserHealthy ? 'connected' : 'disconnected',
        healthy: browserHealthy,
      },
    };
  }

  /**
   * Kiểm tra trạng thái browser
   */
  async checkBrowser(): Promise<{
    healthy: boolean;
    status: string;
    message: string;
  }> {
    try {
      const isHealthy = await this.crawlerService.isHealthy();

      if (isHealthy) {
        return {
          healthy: true,
          status: 'connected',
          message: 'Browser đang hoạt động bình thường',
        };
      } else {
        return {
          healthy: false,
          status: 'disconnected',
          message: 'Browser không hoạt động',
        };
      }
    } catch (error: any) {
      this.logger.error('Lỗi khi kiểm tra browser:', error);
      return {
        healthy: false,
        status: 'error',
        message: error.message,
      };
    }
  }

  /**
   * Restart browser
   */
  async restartBrowser(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.logger.log('Nhận yêu cầu restart browser...');
      await this.crawlerService.restart();

      return {
        success: true,
        message: 'Browser đã được restart thành công',
      };
    } catch (error: any) {
      this.logger.error('Lỗi khi restart browser:', error);
      return {
        success: false,
        message: `Lỗi khi restart: ${error.message}`,
      };
    }
  }
}
