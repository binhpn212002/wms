import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { SortOrder } from '../../../common/dto/page-option.dto';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Warehouse } from '../../../database/entities/warehouse.entity';
import {
  ListWarehousesQueryDto,
  WarehouseSortField,
} from '../dto/list-warehouses-query.dto';

@Injectable()
export class WarehousesRepository extends BaseRepository<Warehouse> {
  constructor(
    @InjectRepository(Warehouse)
    repository: Repository<Warehouse>,
  ) {
    super(repository);
  }

  findById(
    id: string,
    options?: { withDeleted?: boolean },
  ): Promise<Warehouse | null> {
    return this.repository.findOne({
      where: { id },
      withDeleted: options?.withDeleted === true,
    });
  }

  existsActiveByCode(code: string, excludeId?: string): Promise<boolean> {
    const where: FindOptionsWhere<Warehouse> = excludeId
      ? { code, id: Not(excludeId) }
      : { code };
    return this.repository.existsBy(where);
  }

  async findManyWithFilters(
    query: ListWarehousesQueryDto,
  ): Promise<ListResponseDto<Warehouse>> {
    query.normalize();
    const qbBase = this.createQueryBuilder('w');
    if (query.includeDeleted) {
      qbBase.withDeleted();
    }
    if (query.q) {
      qbBase.andWhere(
        '(LOWER(w.code) LIKE LOWER(:q) OR LOWER(w.name) LIKE LOWER(:q))',
        { q: `%${query.q}%` },
      );
    }
    if (query.active !== undefined) {
      qbBase.andWhere('w.active = :active', { active: query.active });
    }

    const total = await qbBase.clone().getCount();

    const qb = qbBase.clone();
    const sortBy = query.sortBy ?? WarehouseSortField.NAME;
    const dir = query.sort === SortOrder.DESC ? 'DESC' : 'ASC';
    const col =
      sortBy === WarehouseSortField.CODE
        ? 'w.code'
        : sortBy === WarehouseSortField.CREATED_AT
          ? 'w.createdAt'
          : 'w.name';
    qb.orderBy(col, dir);

    qb.skip(query.skip).take(query.limit);
    const data = await qb.getMany();
    return ListResponseDto.create(data, total, query.page, query.limit);
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  /** Gỡ ô mặc định khi xóa vị trí (SET NULL). */
  async clearDefaultLocationByLocationId(locationId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(Warehouse)
      .set({ defaultLocationId: null })
      .where('default_location_id = :lid', { lid: locationId })
      .andWhere('deleted_at IS NULL')
      .execute();
  }

  async isDefaultLocationForAnyWarehouse(locationId: string): Promise<boolean> {
    return this.createQueryBuilder('w')
      .where('w.defaultLocationId = :lid', { lid: locationId })
      .andWhere('w.deletedAt IS NULL')
      .getExists();
  }
}
