import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { OutboundLine } from '../../../database/entities/outbound-line.entity';

@Injectable()
export class OutboundLinesRepository extends BaseRepository<OutboundLine> {
  constructor(
    @InjectRepository(OutboundLine)
    repository: Repository<OutboundLine>,
  ) {
    super(repository);
  }

  async deleteByOutboundDocumentId(
    manager: EntityManager,
    outboundDocumentId: string,
  ): Promise<void> {
    await manager.delete(OutboundLine, { outboundDocumentId });
  }

  async softDeleteByOutboundDocumentId(
    manager: EntityManager,
    outboundDocumentId: string,
  ): Promise<void> {
    await manager.softDelete(OutboundLine, { outboundDocumentId });
  }
}
