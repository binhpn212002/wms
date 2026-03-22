import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

export class InboundLineInputDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  lineNo: number;

  @ApiProperty()
  @IsUUID()
  variantId: string;

  @ApiProperty({ example: '10.0000', description: 'Số lượng > 0 (UoM mặc định của sản phẩm)' })
  @IsString()
  @Matches(/^\d+(\.\d+)?$/, { message: 'quantity phải là số dương' })
  quantity: string;

  @ApiPropertyOptional({ example: '100.0000' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d+)?$/, { message: 'unitPrice phải là số' })
  unitPrice?: string | null;

  @ApiPropertyOptional({
    description: 'Nếu bỏ trống, dùng ô mặc định của kho (nếu có)',
  })
  @IsOptional()
  @IsUUID()
  locationId?: string;
}
