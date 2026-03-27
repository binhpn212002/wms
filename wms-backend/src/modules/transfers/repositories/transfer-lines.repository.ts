import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { TransferLine } from '../../../database/entities/transfer-line.entity';

@Injectable()
export class TransferLinesRepository extends BaseRepository<TransferLine> {
  constructor(
    @InjectRepository(TransferLine)
    repository: Repository<TransferLine>,
  ) {
    super(repository);
  }

  async deleteByTransferId(
    manager: EntityManager,
    transferId: string,
  ): Promise<void> {
    await manager.delete(TransferLine, { transferId });
  }

  async softDeleteByTransferId(
    manager: EntityManager,
    transferId: string,
  ): Promise<void> {
    await manager.softDelete(TransferLine, { transferId });
  }
}

