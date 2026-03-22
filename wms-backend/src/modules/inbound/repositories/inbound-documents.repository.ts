import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { SortOrder } from '../../../common/dto/page-option.dto';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { InboundDocument } from '../../../database/entities/inbound-document.entity';
import {
  InboundSortField,
  ListInboundQueryDto,
} from '../dto/list-inbound-query.dto';

@Injectable()
export class InboundDocumentsRepository extends BaseRepository<InboundDocument> {
  constructor(
    @InjectRepository(InboundDocument)
    repository: Repository<InboundDocument>,
  ) {
    super(repository);
  }

  async findByIdWithLines(id: string): Promise<InboundDocument | null> {
    const doc = await this.repository.findOne({
      where: { id },
      relations: ['lines', 'supplier', 'warehouse'],
    });
    if (doc?.lines?.length) {
      doc.lines.sort((a, b) => a.lineNo - b.lineNo);
    }
    return doc;
  }

  async existsByDocumentNo(
    documentNo: string,
    excludeId?: string,
  ): Promise<boolean> {
    const qb = this.createQueryBuilder('d').where('d.documentNo = :no', {
      no: documentNo,
    });
    if (excludeId) {
      qb.andWhere('d.id != :excludeId', { excludeId });
    }
    return qb.getExists();
  }

  async findManyWithFilters(
    query: ListInboundQueryDto,
  ): Promise<ListResponseDto<InboundDocument>> {
    query.normalize();
    const qbBase = this.createQueryBuilder('d')
      .leftJoinAndSelect('d.supplier', 's')
      .leftJoinAndSelect('d.warehouse', 'w');

    if (query.warehouseId) {
      qbBase.andWhere('d.warehouseId = :wid', { wid: query.warehouseId });
    }
    if (query.supplierId) {
      qbBase.andWhere('d.supplierId = :sid', { sid: query.supplierId });
    }
    if (query.status) {
      qbBase.andWhere('d.status = :st', { st: query.status });
    }
    if (query.from) {
      qbBase.andWhere('d.documentDate >= :from', { from: query.from });
    }
    if (query.to) {
      qbBase.andWhere('d.documentDate <= :to', { to: query.to });
    }
    if (query.q) {
      qbBase.andWhere('LOWER(d.documentNo) LIKE LOWER(:q)', {
        q: `%${query.q}%`,
      });
    }

    const total = await qbBase.clone().getCount();

    const qb = qbBase.clone();
    const sortBy = query.sortBy ?? InboundSortField.DOCUMENT_DATE;
    const dir = query.sort === SortOrder.DESC ? 'DESC' : 'ASC';
    const col =
      sortBy === InboundSortField.DOCUMENT_NO
        ? 'd.documentNo'
        : sortBy === InboundSortField.CREATED_AT
          ? 'd.createdAt'
          : 'd.documentDate';
    qb.orderBy(col, dir);

    qb.skip(query.skip).take(query.limit);
    const data = await qb.getMany();
    return ListResponseDto.create(data, total, query.page, query.limit);
  }
}
