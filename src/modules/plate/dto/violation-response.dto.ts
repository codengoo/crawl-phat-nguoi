import { ApiProperty } from '@nestjs/swagger';
import { ViolationData } from '../interfaces/violation.interface';

/**
 * DTO cho response tra cứu vi phạm
 */
export class ViolationResponseDto {
  @ApiProperty({
    description: 'Tra cứu thành công hay không',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Biển số xe được tra cứu',
    example: '30E43807',
  })
  plateNumber: string;

  @ApiProperty({
    description: 'Loại phương tiện',
    example: 'car',
  })
  vehicleType: string;

  @ApiProperty({
    description: 'Danh sách vi phạm (mảng rỗng nếu không có vi phạm)',
    type: 'array',
    items: {
      type: 'object',
    },
    example: [
      {
        plateNumber: '30E-438.07',
        status: 'Chưa xử phạt',
        vehicleInfo: {
          vehicleType: 'Ô tô',
          plateColor: 'Nền màu trắng, chữ và số màu đen',
        },
        violationDetail: {
          violationType:
            '16824.6.9.b.01.Không chấp hành hiệu lệnh của đèn tín hiệu giao thông',
          time: '10:24, 29/12/2025',
          location:
            'Tràng Tiền - Trần Quang Khải (VT87), Phường Hoàn Kiếm, Thành phố Hà Nội',
        },
        processingUnit: {
          detectingUnit:
            'Đội CHGT&ĐK Đèn THGT - Phòng Cảnh sát giao thông - Công an Thành phố Hà Nội',
          detectingAddress: 'Số 54 Trần Hưng Đạo, Phường Cửa Nam, Hà Nội',
          resolvingUnit:
            'Đội CSGT ĐB số 6 - Phòng Cảnh sát giao thông - Công an Thành phố Hà Nội',
          resolvingAddress: 'số 2 Phạm Hùng, Phường Từ Liêm, Hà Nội',
          phone: '02437683373',
        },
      },
    ],
  })
  data: ViolationData[];

  @ApiProperty({
    description: 'Thông báo lỗi (nếu có)',
    example: null,
    required: false,
  })
  error?: string;
}
