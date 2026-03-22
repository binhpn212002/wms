import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { OutboundLineInputDto } from './outbound-line-input.dto';

export class ReplaceOutboundLinesDto {
  @ApiProperty({ type: [OutboundLineInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutboundLineInputDto)
  lines: OutboundLineInputDto[];
}
