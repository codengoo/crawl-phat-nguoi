import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Matches, IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleType } from '../interfaces/violation.interface';

/**
 * DTO cho một biển số trong danh sách tra cứu
 */
export class PlateNumberItem {
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

/**
 * DTO cho request tra cứu nhiều vi phạm
 */
export class LookupMultipleViolationDto {
  @ApiProperty({
    description: 'Danh sách biển số xe cần tra cứu (tối thiểu 1, tối đa 20)',
    type: [PlateNumberItem],
    example: [
      { plateNumber: '30E43807', vehicleType: 'car' },
      { plateNumber: '51F12345', vehicleType: 'motorbike' },
      { plateNumber: '29A98765', vehicleType: 'car' },
    ],
  })
  @IsArray({ message: 'Danh sách biển số phải là một mảng' })
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 biển số để tra cứu' })
  @ArrayMaxSize(20, { message: 'Chỉ được tra cứu tối đa 20 biển số cùng lúc' })
  @ValidateNested({ each: true })
  @Type(() => PlateNumberItem)
  plateNumbers: PlateNumberItem[];
}
