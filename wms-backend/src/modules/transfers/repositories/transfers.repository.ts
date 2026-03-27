import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { SortOrder } from '../../../common/dto/page-option.dto';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Transfer } from '../../../database/entities/transfer.entity';
import {
  ListTransfersQueryDto,
  TransferSortField,
} from '../dto/list-transfers-query.dto';

@Injectable()
export class TransfersRepository extends BaseRepository<Transfer> {
  constructor(
    @InjectRepository(Transfer)
    repository: Repository<Transfer>,
  ) {
    super(repository);
  }

  async findByIdWithLines(id: string): Promise<Transfer | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['lines'],
      order: { lines: { createdAt: 'ASC' } },
    });
  }

  async existsByDocumentNo(documentNo: string, excludeId?: string): Promise<boolean> {
    const qb = this.createQueryBuilder('d').where('d.documentNo = :no', {
      no: documentNo,
    });
    if (excludeId) {
      qb.andWhere('d.id != :excludeId', { excludeId });
    }
    return qb.getExists();
  }

  async findManyWithFilters(
    query: ListTransfersQueryDto,
  ): Promise<ListResponseDto<Transfer>> {
    query.normalize();
    const qbBase = this.createQueryBuilder('d');

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
    const sortBy = query.sortBy ?? TransferSortField.DOCUMENT_DATE;
    const dir = query.sort === SortOrder.DESC ? 'DESC' : 'ASC';
    const col =
      sortBy === TransferSortField.DOCUMENT_NO
        ? 'd.documentNo'
        : sortBy === TransferSortField.CREATED_AT
          ? 'd.createdAt'
          : 'd.documentDate';
    qb.orderBy(col, dir);

    qb.skip(query.skip).take(query.limit);
    const data = await qb.getMany();
    return ListResponseDto.create(data, total, query.page, query.limit);
  }
}

