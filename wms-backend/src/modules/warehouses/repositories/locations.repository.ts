import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { SortOrder } from '../../../common/dto/page-option.dto';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Location } from '../../../database/entities/location.entity';
import {
  ListLocationsQueryDto,
  LocationSortField,
} from '../dto/list-locations-query.dto';

@Injectable()
export class LocationsRepository extends BaseRepository<Location> {
  constructor(
    @InjectRepository(Location)
    repository: Repository<Location>,
  ) {
    super(repository);
  }

  findById(
    id: string,
    options?: { withDeleted?: boolean },
  ): Promise<Location | null> {
    return this.repository.findOne({
      where: { id },
      withDeleted: options?.withDeleted === true,
    });
  }

  findByIdAndWarehouseId(
    id: string,
    warehouseId: string,
    options?: { withDeleted?: boolean },
  ): Promise<Location | null> {
    return this.repository.findOne({
      where: { id, warehouseId },
      withDeleted: options?.withDeleted === true,
    });
  }

  async findActiveByWarehouseId(warehouseId: string): Promise<Location[]> {
    return this.repository.find({
      where: { warehouseId },
      order: { code: 'ASC' },
    });
  }

  /** Mọi dòng theo kho (kể cả đã xóa mềm nếu `includeDeleted`). */
  async findByWarehouseId(
    warehouseId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<Location[]> {
    const qb = this.createQueryBuilder('l')
      .where('l.warehouseId = :wid', { wid: warehouseId })
      .orderBy('l.code', 'ASC');
    if (options?.includeDeleted) {
      qb.withDeleted();
    }
    return qb.getMany();
  }

  async existsActiveByWarehouseAndCode(
    warehouseId: string,
    code: string,
    excludeId?: string,
  ): Promise<boolean> {
    const qb = this.createQueryBuilder('l')
      .where('l.warehouseId = :wid', { wid: warehouseId })
      .andWhere('l.code = :code', { code })
      .andWhere('l.deletedAt IS NULL');
    if (excludeId) {
      qb.andWhere('l.id != :excludeId', { excludeId });
    }
    return qb.getExists();
  }

  async countActiveChildren(parentId: string): Promise<number> {
    return this.repository.count({
      where: { parentId },
    });
  }

  async findManyWithFilters(
    warehouseId: string,
    query: ListLocationsQueryDto,
  ): Promise<ListResponseDto<Location>> {
    query.normalize();
    const qbBase = this.createQueryBuilder('l').where('l.warehouseId = :wid', {
      wid: warehouseId,
    });
    if (query.includeDeleted) {
      qbBase.withDeleted();
    }
    if (query.type) {
      qbBase.andWhere('l.type = :type', { type: query.type });
    }
    if (query.q) {
      qbBase.andWhere(
        '(LOWER(l.code) LIKE LOWER(:q) OR LOWER(l.name) LIKE LOWER(:q))',
        { q: `%${query.q}%` },
      );
    }

    const total = await qbBase.clone().getCount();

    const qb = qbBase.clone();
    const sortBy = query.sortBy ?? LocationSortField.CODE;
    const dir = query.sort === SortOrder.DESC ? 'DESC' : 'ASC';
    const col =
      sortBy === LocationSortField.NAME
        ? 'l.name'
        : sortBy === LocationSortField.CREATED_AT
          ? 'l.createdAt'
          : 'l.code';
    qb.orderBy(col, dir);

    qb.skip(query.skip).take(query.limit);
    const data = await qb.getMany();
    return ListResponseDto.create(data, total, query.page, query.limit);
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
