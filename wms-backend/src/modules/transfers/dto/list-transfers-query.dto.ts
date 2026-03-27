import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { PageOptionDto } from '../../../common/dto/page-option.dto';
import { TransferStatus } from '../../../common/constants/transfers.constant';

export enum TransferSortField {
  DOCUMENT_DATE = 'document_date',
  DOCUMENT_NO = 'document_no',
  CREATED_AT = 'created_at',
}

export class ListTransfersQueryDto extends PageOptionDto {
  @ApiPropertyOptional({ enum: TransferSortField })
  @IsOptional()
  @IsEnum(TransferSortField)
  sortBy?: TransferSortField;

  @ApiPropertyOptional({ enum: TransferStatus })
  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

