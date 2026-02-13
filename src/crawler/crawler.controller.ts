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
import { LookupMultipleViolationDto } from './dto/lookup-multiple-violation.dto';
import { ViolationResponseDto } from './dto/violation-response.dto';
import { MultipleViolationResponseDto } from './dto/multiple-violation-response.dto';

@ApiTags('violations')
@Controller('violations')
export class CrawlerController {
    private readonly logger = new Logger(CrawlerController.name);

    constructor(private readonly crawlerService: CrawlerService) { }

    @Post('lookup')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Tra cứu vi phạm giao thông',
        description:
            'Tra cứu thông tin xe vi phạm từ cổng thông tin CSGT Việt Nam theo biển số xe và loại phương tiện',
    })
    @ApiResponse({
        status: 200,
        description: 'Tra cứu thành công',
        type: ViolationResponseDto,
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

    @Post('lookup/multiple')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Tra cứu nhiều vi phạm giao thông cùng lúc',
        description:
            'Tra cứu thông tin vi phạm cho nhiều biển số xe cùng lúc (tối đa 20 biển số). ' +
            'Sử dụng chung một browser context nên hiệu suất cao hơn việc gọi nhiều request riêng lẻ.',
    })
    @ApiResponse({
        status: 200,
        description: 'Tra cứu thành công',
        type: MultipleViolationResponseDto,
    })
    async lookupMultipleViolations(
        @Body() lookupDto: LookupMultipleViolationDto,
    ): Promise<MultipleViolationResponseDto> {
        this.logger.log(
            `Nhận request tra cứu nhiều biển số: ${lookupDto.plateNumbers.length} biển số`,
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
