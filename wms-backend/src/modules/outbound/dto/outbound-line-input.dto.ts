import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Matches, Min } from 'class-validator';

export class OutboundLineInputDto {
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

  @ApiProperty({ description: 'Ô nguồn (bin) trong kho của phiếu' })
  @IsUUID()
  locationId: string;
}
