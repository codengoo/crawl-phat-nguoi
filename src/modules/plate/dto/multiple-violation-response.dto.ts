import { ApiProperty } from '@nestjs/swagger';
import { ViolationResponseDto } from './violation-response.dto';

/**
 * DTO cho response tra cứu nhiều vi phạm
 */
export class MultipleViolationResponseDto {
  @ApiProperty({
    description: 'Tổng số biển số được tra cứu',
    example: 3,
  })
  total: number;

  @ApiProperty({
    description: 'Số biển số tra cứu thành công',
    example: 3,
  })
  successful: number;

  @ApiProperty({
    description: 'Số biển số tra cứu thất bại',
    example: 0,
  })
  failed: number;

  @ApiProperty({
    description: 'Danh sách kết quả tra cứu cho từng biển số',
    type: [ViolationResponseDto],
    example: [
      {
        success: true,
        plateNumber: '30E43807',
        vehicleType: 'car',
        data: [],
      },
      {
        success: true,
        plateNumber: '51F12345',
        vehicleType: 'motorbike',
        data: [],
      },
    ],
  })
  results: ViolationResponseDto[];
}
