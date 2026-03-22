import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PageOptionDto } from '../../../common/dto/page-option.dto';
import { OutboundDocumentStatus } from '../../../common/constants/outbound.constant';

export enum OutboundSortField {
  DOCUMENT_DATE = 'document_date',
  DOCUMENT_NO = 'document_no',
  CREATED_AT = 'created_at',
}

export class ListOutboundQueryDto extends PageOptionDto {
  @ApiPropertyOptional({ enum: OutboundSortField })
  @IsOptional()
  @IsEnum(OutboundSortField)
  sortBy?: OutboundSortField;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ enum: OutboundDocumentStatus })
  @IsOptional()
  @IsEnum(OutboundDocumentStatus)
  status?: OutboundDocumentStatus;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
