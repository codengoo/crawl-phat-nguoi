import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { CrawlerService } from './crawler.service';
import { LookupViolationDto } from './dto/lookup-violation.dto';
import { ViolationResponseDto } from './dto/violation-response.dto';

/**
 * Controller xử lý các endpoint liên quan đến tra cứu vi phạm
 */
@ApiTags('violations')
@Controller('violations')
export class CrawlerController {
  private readonly logger = new Logger(CrawlerController.name);

  constructor(private readonly crawlerService: CrawlerService) {}

  /**
   * Endpoint tra cứu vi phạm theo biển số xe
   * @param lookupDto DTO chứa biển số và loại xe
   * @returns Kết quả tra cứu vi phạm
   */
  @Post('lookup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tra cứu vi phạm giao thông',
    description:
      'Tra cứu thông tin xe vi phạm từ cổng thông tin CSGT Việt Nam theo biển số xe và loại phương tiện',
  })
  @ApiBody({ type: LookupViolationDto })
  @ApiResponse({
    status: 200,
    description: 'Tra cứu thành công',
    type: ViolationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu đầu vào không hợp lệ',
  })
  @ApiResponse({
    status: 500,
    description: 'Lỗi server',
  })
  async lookupViolation(
    @Body() lookupDto: LookupViolationDto,
  ): Promise<ViolationResponseDto> {
    this.logger.log(
      `Nhận request tra cứu: ${lookupDto.plateNumber} - ${lookupDto.vehicleType}`,
    );

    const result = await this.crawlerService.lookupViolation(
      lookupDto.plateNumber,
      lookupDto.vehicleType,
    );

    return {
      success: result.success,
      plateNumber: result.plateNumber,
      vehicleType: result.vehicleType,
      data: result.data || [],
      error: result.error,
    };
  }
}
