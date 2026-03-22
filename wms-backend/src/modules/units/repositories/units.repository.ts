import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { SortOrder } from 'src/common/dto/page-option.dto';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Unit } from '../../../database/entities/unit.entity';
import { ListUnitsQueryDto, UnitSortField } from '../dto/list-units-query.dto';

@Injectable()
export class UnitsRepository extends BaseRepository<Unit> {
  constructor(
    @InjectRepository(Unit)
    repository: Repository<Unit>,
  ) {
    super(repository);
  }

  findById(
    id: string,
    options?: { withDeleted?: boolean },
  ): Promise<Unit | null> {
    return this.repository.findOne({
      where: { id },
      withDeleted: options?.withDeleted === true,
    });
  }

  existsActiveByCode(code: string, excludeId?: string): Promise<boolean> {
    const where: FindOptionsWhere<Unit> = excludeId
      ? { code, id: Not(excludeId) }
      : { code };
    return this.repository.existsBy(where);
  }

  async findManyWithFilters(
    query: ListUnitsQueryDto,
  ): Promise<ListResponseDto<Unit>> {
    query.normalize();
    const qb = this.createQueryBuilder('u');
    if (query.includeDeleted) {
      qb.withDeleted();
    }
    if (query.q) {
      qb.andWhere(
        '(LOWER(u.code) LIKE LOWER(:q) OR LOWER(u.name) LIKE LOWER(:q) OR (u.symbol IS NOT NULL AND LOWER(u.symbol) LIKE LOWER(:q)))',
        { q: `%${query.q}%` },
      );
    }
    if (query.active !== undefined) {
      qb.andWhere('u.active = :active', { active: query.active });
    }
    const sortBy = query.sortBy ?? UnitSortField.NAME;
    const dir = query.sort === SortOrder.DESC ? 'DESC' : 'ASC';
    const col =
      sortBy === UnitSortField.CODE
        ? 'u.code'
        : sortBy === UnitSortField.CREATED_AT
          ? 'u.createdAt'
          : 'u.name';
    qb.orderBy(col, dir);
    qb.skip(query.skip).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return ListResponseDto.create(data, total, query.page, query.limit);
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
