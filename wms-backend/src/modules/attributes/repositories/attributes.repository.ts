import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { AttributeValue } from '../../../database/entities/attribute-value.entity';
import { Attribute } from '../../../database/entities/attribute.entity';
import { ListAttributesQueryDto } from '../dto/list-attributes-query.dto';
import { SortOrder } from 'src/common/dto/page-option.dto';

@Injectable()
export class AttributesRepository extends BaseRepository<Attribute> {
  constructor(
    @InjectRepository(Attribute)
    repository: Repository<Attribute>,
    @InjectRepository(AttributeValue)
    private readonly attributeValueRepository: Repository<AttributeValue>,
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
    if (query.sort !== undefined) {
      qb.orderBy('a.id', query.sort === SortOrder.ASC ? 'ASC' : 'DESC');
    }
    qb.skip(query.skip).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return ListResponseDto.create(data, total, query.page, query.limit);
  }

  /** Đếm giá trị thuộc tính chưa xóa mềm thuộc attribute. */
  countValuesByAttributeId(attributeId: string): Promise<number> {
    return this.attributeValueRepository.countBy({ attributeId });
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
