import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Kiểm tra trạng thái tổng thể của service',
    description: 'Trả về thông tin về uptime, trạng thái browser và service',
  })
  @ApiResponse({
    status: 200,
    description: 'Service đang hoạt động',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-02-13T10:30:00.000Z',
        uptime: 3600,
        browser: {
          status: 'connected',
          healthy: true,
        },
      },
    },
  })
  async checkHealth() {
    return await this.healthService.checkHealth();
  }

  @Get('browser')
  @ApiOperation({
    summary: 'Kiểm tra trạng thái Playwright browser',
    description: 'Kiểm tra xem browser có đang chạy ổn định không',
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin trạng thái browser',
    schema: {
      example: {
        healthy: true,
        status: 'connected',
        message: 'Browser đang hoạt động bình thường',
      },
    },
  })
  async checkBrowser() {
    return await this.healthService.checkBrowser();
  }

  /**
   * Endpoint restart browser
   */
  @Post('browser/restart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restart Playwright browser',
    description: 'Đóng và khởi động lại browser (hữu ích khi browser bị lỗi)',
  })
  @ApiResponse({
    status: 200,
    description: 'Browser đã được restart',
    schema: {
      example: {
        success: true,
        message: 'Browser đã được restart thành công',
      },
    },
  })
  async restartBrowser() {
    return await this.healthService.restartBrowser();
  }
}
