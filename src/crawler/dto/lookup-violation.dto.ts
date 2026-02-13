import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';
import { VehicleType } from '../interfaces/violation.interface';

/**
 * DTO cho request tra cứu vi phạm
 */
export class LookupViolationDto {
  @ApiProperty({
    description: 'Biển số xe (ví dụ: 30E43807, 51F12345)',
    example: '30E43807',
    pattern: '^[0-9]{2}[A-Z]{1,2}[0-9]{4,5}$',
  })
  @IsNotEmpty({ message: 'Biển số xe không được để trống' })
  @IsString({ message: 'Biển số xe phải là chuỗi ký tự' })
  @Matches(/^[0-9]{2}[A-Z]{1,2}[0-9]{4,5}$/i, {
    message: 'Biển số xe không đúng định dạng (VD: 30E43807)',
  })
  plateNumber: string;

  @ApiProperty({
    description: 'Loại phương tiện',
    enum: VehicleType,
    example: VehicleType.CAR,
    default: VehicleType.CAR,
  })
  @IsEnum(VehicleType, {
    message: 'Loại xe phải là: motorbike, car, hoặc electricbike',
  })
  vehicleType: VehicleType = VehicleType.CAR;
}
