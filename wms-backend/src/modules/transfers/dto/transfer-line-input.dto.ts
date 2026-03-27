import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class TransferLineInputDto {
  @ApiProperty()
  @IsUUID()
  variantId: string;

  @ApiProperty({ description: 'Số lượng > 0 (string decimal)' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : String(value),
  )
  @IsString()
  @IsNotEmpty()
  quantity: string;

  @ApiProperty()
  @IsUUID()
  warehouseIdFrom: string;

  @ApiProperty()
  @IsUUID()
  locationIdFrom: string;

  @ApiProperty()
  @IsUUID()
  warehouseIdTo: string;

  @ApiProperty()
  @IsUUID()
  locationIdTo: string;
}

