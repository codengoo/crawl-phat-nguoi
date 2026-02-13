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
} from '@nestjs/swagger';
import { CrawlerService } from './crawler.service';
import { LookupMultipleViolationDto } from './dto/lookup-multiple-violation.dto';
import { MultipleViolationResponseDto } from './dto/multiple-violation-response.dto';

@ApiTags('violations')
@Controller('violations')
export class CrawlerController {
  private readonly logger = new Logger(CrawlerController.name);

  constructor(private readonly crawlerService: CrawlerService) {}

  @Post('lookup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tra cứu vi phạm giao thông',
    description:
      'Tra cứu thông tin vi phạm cho nhiều biển số xe cùng lúc (tối đa 20 biển số). ' +
      'Kết quả được cache trong 1 giờ để tăng tốc độ tra cứu. ' +
      'Sử dụng chung một browser context nên hiệu suất cao.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tra cứu thành công',
    type: MultipleViolationResponseDto,
  })
  async lookupViolations(
    @Body() lookupDto: LookupMultipleViolationDto,
  ): Promise<MultipleViolationResponseDto> {
    this.logger.log(
      `Nhận request tra cứu ${lookupDto.plateNumbers.length} biển số`,
    );

    const results = await this.crawlerService.lookupMultipleViolations(
      lookupDto.plateNumbers,
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      total: results.length,
      successful,
      failed,
      results: results.map(result => ({
        success: result.success,
        plateNumber: result.plateNumber,
        vehicleType: result.vehicleType,
        data: result.data || [],
        error: result.error,
      })),
    };
  }
}
