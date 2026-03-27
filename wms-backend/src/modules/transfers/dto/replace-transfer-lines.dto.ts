import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { TransferLineInputDto } from './transfer-line-input.dto';

export class ReplaceTransferLinesDto {
  @ApiProperty({ type: [TransferLineInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TransferLineInputDto)
  lines: TransferLineInputDto[];
}

