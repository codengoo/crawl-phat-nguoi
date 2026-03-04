import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Logger,
    Post,
} from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { LookupMultipleViolationDto, MultipleViolationResponseDto } from './dto';
import { PlateService } from './plate.service';

@ApiTags('plates')
@Controller('plates')
export class PlateController {
  private readonly logger = new Logger(PlateController.name);

  constructor(private readonly plateService: PlateService) {}

  @Post('lookup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tra cứu vi phạm giao thông theo biển số',
    description:
      'Tra cứu thông tin vi phạm cho nhiều biển số xe cùng lúc (tối đa 20 biển số). ' +
      'Kết quả được cache trong 1 giờ để tăng tốc độ tra cứu. ' +
      'Sử dụng chung một browser context nên hiệu suất cao. ' +
      'Tự động thử lại với proxy nếu gặp timeout.',
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

    const results = await this.plateService.lookupMultipleViolations(
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
