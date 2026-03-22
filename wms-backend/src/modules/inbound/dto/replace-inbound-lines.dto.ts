import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { InboundLineInputDto } from './inbound-line-input.dto';

export class ReplaceInboundLinesDto {
  @ApiProperty({ type: [InboundLineInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InboundLineInputDto)
  lines: InboundLineInputDto[];
}
