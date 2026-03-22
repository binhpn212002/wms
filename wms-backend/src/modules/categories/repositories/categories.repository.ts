import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Category } from '../../../database/entities/category.entity';
import { ListCategoriesQueryDto } from '../dto/list-categories-query.dto';

@Injectable()
export class CategoriesRepository extends BaseRepository<Category> {
  constructor(
    @InjectRepository(Category)
    repository: Repository<Category>,
  ) {
    super(repository);
  }

  findById(
    id: string,
    options?: { withDeleted?: boolean },
  ): Promise<Category | null> {
    return this.repository.findOne({
      where: { id },
      withDeleted: options?.withDeleted === true,
    });
  }

  /** Bản ghi chưa xóa mềm đã trùng `code` (bỏ qua `excludeId` khi PATCH). */
  existsActiveByCode(code: string, excludeId?: string): Promise<boolean> {
    const where: FindOptionsWhere<Category> = excludeId
      ? { code, id: Not(excludeId) }
      : { code };
    return this.repository.existsBy(where);
  }

  async findManyWithFilters(
    query: ListCategoriesQueryDto,
  ): Promise<ListResponseDto<Category>> {
    query.normalize();
    const qb = this.createQueryBuilder('c');
    if (query.includeDeleted) {
      qb.withDeleted();
    }
    if (query.q) {
      qb.andWhere(
        '(LOWER(c.code) LIKE LOWER(:q) OR LOWER(c.name) LIKE LOWER(:q))',
        { q: `%${query.q}%` },
      );
    }
    if (query.active !== undefined) {
      qb.andWhere('c.active = :active', { active: query.active });
    }
    if (query.parent_id !== undefined) {
      if (query.parent_id === null) {
        qb.andWhere('c.parentId IS NULL');
      } else {
        qb.andWhere('c.parentId = :parentId', { parentId: query.parent_id });
      }
    }
    const sort = query.sort ?? 'code';
    if (sort === 'name') {
      qb.orderBy('c.name', 'ASC');
    } else if (sort === 'created_at') {
      qb.orderBy('c.createdAt', 'ASC');
    } else {
      qb.orderBy('c.code', 'ASC');
    }
    qb.skip(query.skip).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return ListResponseDto.create(data, total, query.page, query.limit);
  }

  findAllForTree(
    active?: boolean,
    includeDeleted?: boolean,
  ): Promise<Category[]> {
    const qb = this.createQueryBuilder('c');
    if (includeDeleted) {
      qb.withDeleted();
    }
    if (active !== undefined) {
      qb.andWhere('c.active = :active', { active });
    }
    qb.orderBy('c.code', 'ASC');
    return qb.getMany();
  }

  countDirectChildren(parentId: string): Promise<number> {
    return this.repository.count({ where: { parentId } });
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
