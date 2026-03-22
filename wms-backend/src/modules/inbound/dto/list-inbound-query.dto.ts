import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { PageOptionDto } from '../../../common/dto/page-option.dto';
import { InboundDocumentStatus } from '../../../common/constants/inbound.constant';

export enum InboundSortField {
  DOCUMENT_DATE = 'document_date',
  DOCUMENT_NO = 'document_no',
  CREATED_AT = 'created_at',
}

export class ListInboundQueryDto extends PageOptionDto {
  @ApiPropertyOptional({ enum: InboundSortField })
  @IsOptional()
  @IsEnum(InboundSortField)
  sortBy?: InboundSortField;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ enum: InboundDocumentStatus })
  @IsOptional()
  @IsEnum(InboundDocumentStatus)
  status?: InboundDocumentStatus;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  to?: string;

}
