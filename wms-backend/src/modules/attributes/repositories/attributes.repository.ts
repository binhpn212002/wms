import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Attribute } from '../../../database/entities/attribute.entity';
import { ListAttributesQueryDto } from '../dto/list-attributes-query.dto';

@Injectable()
export class AttributesRepository extends BaseRepository<Attribute> {
  constructor(
    @InjectRepository(Attribute)
    repository: Repository<Attribute>,
  ) {
    super(repository);
  }

  findById(
    id: string,
    options?: { withDeleted?: boolean },
  ): Promise<Attribute | null> {
    return this.repository.findOne({
      where: { id },
      withDeleted: options?.withDeleted === true,
    });
  }

  /**
   * Đã có bản ghi **chưa xóa mềm** trùng `code` (không tính `excludeId` — dùng khi PATCH).
   */
  existsActiveByCode(code: string, excludeId?: string): Promise<boolean> {
    const where: FindOptionsWhere<Attribute> = excludeId
      ? { code, id: Not(excludeId) }
      : { code };
    return this.repository.existsBy(where);
  }

  async findManyWithFilters(
    query: ListAttributesQueryDto,
  ): Promise<ListResponseDto<Attribute>> {
    query.normalize();
    const qb = this.createQueryBuilder('a');
    if (query.includeDeleted) {
      qb.withDeleted();
    }
    if (query.q) {
      qb.andWhere(
        '(LOWER(a.code) LIKE LOWER(:q) OR LOWER(a.name) LIKE LOWER(:q))',
        { q: `%${query.q}%` },
      );
    }
    if (query.active !== undefined) {
      qb.andWhere('a.active = :active', { active: query.active });
    }
    const sort = query.sort ?? 'sort_order';
    if (sort === 'name') {
      qb.orderBy('a.name', 'ASC');
    } else if (sort === 'created_at') {
      qb.orderBy('a.createdAt', 'ASC');
    } else if (sort === 'code') {
      qb.orderBy('a.code', 'ASC');
    } else {
      qb.orderBy('a.sortOrder', 'ASC', 'NULLS LAST').addOrderBy('a.name', 'ASC');
    }
    qb.skip(query.skip).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return ListResponseDto.create(data, total, query.page, query.limit);
  }

  /**
   * Đếm giá trị thuộc tính — bổ sung khi có bảng `attribute_values`.
   */
  async countValuesByAttributeId(_attributeId: string): Promise<number> {
    void _attributeId;
    return 0;
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
