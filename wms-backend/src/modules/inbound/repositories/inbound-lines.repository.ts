import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { InboundLine } from '../../../database/entities/inbound-line.entity';

@Injectable()
export class InboundLinesRepository extends BaseRepository<InboundLine> {
  constructor(
    @InjectRepository(InboundLine)
    repository: Repository<InboundLine>,
  ) {
    super(repository);
  }

  async deleteByInboundDocumentId(
    manager: EntityManager,
    inboundDocumentId: string,
  ): Promise<void> {
    await manager.delete(InboundLine, { inboundDocumentId });
  }

  async softDeleteByInboundDocumentId(
    manager: EntityManager,
    inboundDocumentId: string,
  ): Promise<void> {
    await manager.softDelete(InboundLine, { inboundDocumentId });
  }
}
