import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransferStatus } from '../../../common/constants/transfers.constant';
import { Transfer } from '../../../database/entities/transfer.entity';
import { TransferLineResponseDto } from './transfer-line-response.dto';

export class TransferResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  documentNo: string;

  @ApiProperty()
  documentDate: string;

  @ApiProperty({ enum: TransferStatus })
  status: TransferStatus;

  @ApiPropertyOptional()
  note: string | null;

  @ApiPropertyOptional()
  completedAt: Date | null;

  @ApiPropertyOptional({ type: [TransferLineResponseDto] })
  lines?: TransferLineResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(
    doc: Transfer,
    options?: { includeLines?: boolean },
  ): TransferResponseDto {
    const dto = new TransferResponseDto();
    dto.id = doc.id;
    dto.documentNo = doc.documentNo;
    dto.documentDate =
      typeof doc.documentDate === 'string'
        ? doc.documentDate
        : (doc.documentDate as unknown as Date).toISOString().slice(0, 10);
    dto.status = doc.status as TransferStatus;
    dto.note = doc.note;
    dto.completedAt = doc.completedAt;
    dto.createdAt = doc.createdAt;
    dto.updatedAt = doc.updatedAt;

    if (options?.includeLines !== false && doc.lines?.length) {
      dto.lines = doc.lines.map((l) => TransferLineResponseDto.fromEntity(l));
    }
    return dto;
  }
}

