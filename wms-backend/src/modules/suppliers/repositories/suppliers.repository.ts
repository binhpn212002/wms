import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { SortOrder } from '../../../common/dto/page-option.dto';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Supplier } from '../../../database/entities/supplier.entity';
import {
  ListSuppliersQueryDto,
  SupplierSortField,
} from '../dto/list-suppliers-query.dto';

@Injectable()
export class SuppliersRepository extends BaseRepository<Supplier> {
  constructor(
    @InjectRepository(Supplier)
    repository: Repository<Supplier>,
  ) {
    super(repository);
  }

  findById(
    id: string,
    options?: { withDeleted?: boolean },
  ): Promise<Supplier | null> {
    return this.repository.findOne({
      where: { id },
      withDeleted: options?.withDeleted === true,
    });
  }

  existsActiveByCode(code: string, excludeId?: string): Promise<boolean> {
    const where: FindOptionsWhere<Supplier> = excludeId
      ? { code, id: Not(excludeId) }
      : { code };
    return this.repository.existsBy(where);
  }

  async existsActiveByTaxId(
    taxId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const qb = this.createQueryBuilder('s')
      .where('s.tax_id = :taxId', { taxId })
      .andWhere('s.tax_id IS NOT NULL');
    if (excludeId) {
      qb.andWhere('s.id != :excludeId', { excludeId });
    }
    return qb.getExists();
  }

  async findByIdWithContacts(
    id: string,
    options?: { withDeleted?: boolean },
  ): Promise<Supplier | null> {
    const qb = this.createQueryBuilder('s');
    if (options?.withDeleted) {
      qb.withDeleted();
    }
    qb.where('s.id = :id', { id });
    qb.leftJoinAndSelect('s.contacts', 'c');
    qb.orderBy('c.isPrimary', 'DESC').addOrderBy('c.name', 'ASC');
    return qb.getOne();
  }

  async findManyWithFilters(
    query: ListSuppliersQueryDto,
  ): Promise<ListResponseDto<Supplier>> {
    query.normalize();
    const qbBase = this.createQueryBuilder('s');
    if (query.includeDeleted) {
      qbBase.withDeleted();
    }
    if (query.q) {
      qbBase.andWhere(
        '(LOWER(s.code) LIKE LOWER(:q) OR LOWER(s.name) LIKE LOWER(:q))',
        { q: `%${query.q}%` },
      );
    }
    if (query.active !== undefined) {
      qbBase.andWhere('s.active = :active', { active: query.active });
    }

    const total = await qbBase.clone().getCount();

    const qb = qbBase.clone();
    const sortBy = query.sortBy ?? SupplierSortField.NAME;
    const dir = query.sort === SortOrder.DESC ? 'DESC' : 'ASC';
    const col =
      sortBy === SupplierSortField.CODE
        ? 's.code'
        : sortBy === SupplierSortField.CREATED_AT
          ? 's.createdAt'
          : 's.name';
    qb.orderBy(col, dir);

    if (query.includeContacts) {
      qb.leftJoinAndSelect('s.contacts', 'c');
      qb.addOrderBy('c.isPrimary', 'DESC').addOrderBy('c.name', 'ASC');
    } else {
      qb.loadRelationCountAndMap('s.contactCount', 's.contacts');
    }

    qb.skip(query.skip).take(query.limit);
    const data = await qb.getMany();
    return ListResponseDto.create(data, total, query.page, query.limit);
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
