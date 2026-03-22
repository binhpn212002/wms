import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { SortOrder } from '../../../common/dto/page-option.dto';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { OutboundDocument } from '../../../database/entities/outbound-document.entity';
import {
  ListOutboundQueryDto,
  OutboundSortField,
} from '../dto/list-outbound-query.dto';

@Injectable()
export class OutboundDocumentsRepository extends BaseRepository<OutboundDocument> {
  constructor(
    @InjectRepository(OutboundDocument)
    repository: Repository<OutboundDocument>,
  ) {
    super(repository);
  }

  async findByIdWithLines(id: string): Promise<OutboundDocument | null> {
    const doc = await this.repository.findOne({
      where: { id },
      relations: ['lines', 'warehouse'],
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
    query: ListOutboundQueryDto,
  ): Promise<ListResponseDto<OutboundDocument>> {
    query.normalize();
    const qbBase = this.createQueryBuilder('d').leftJoinAndSelect(
      'd.warehouse',
      'w',
    );

    if (query.warehouseId) {
      qbBase.andWhere('d.warehouseId = :wid', { wid: query.warehouseId });
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
    const sortBy = query.sortBy ?? OutboundSortField.DOCUMENT_DATE;
    const dir = query.sort === SortOrder.DESC ? 'DESC' : 'ASC';
    const col =
      sortBy === OutboundSortField.DOCUMENT_NO
        ? 'd.documentNo'
        : sortBy === OutboundSortField.CREATED_AT
          ? 'd.createdAt'
          : 'd.documentDate';
    qb.orderBy(col, dir);

    qb.skip(query.skip).take(query.limit);
    const data = await qb.getMany();
    return ListResponseDto.create(data, total, query.page, query.limit);
  }
}
