import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Not, Repository } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { AttributeValue } from '../../../database/entities/attribute-value.entity';
import { ProductVariantAttributeValue } from '../../../database/entities/product-variant-attribute-value.entity';
import { ListAttributeValuesQueryDto } from '../dto/list-attribute-values-query.dto';
import { SortOrder } from 'src/common/dto/page-option.dto';

@Injectable()
export class AttributeValuesRepository extends BaseRepository<AttributeValue> {
  constructor(
    @InjectRepository(AttributeValue)
    repository: Repository<AttributeValue>,
  ) {
    super(repository);
  }

  findByIdForAttribute(
    attributeId: string,
    id: string,
    options?: { withDeleted?: boolean },
  ): Promise<AttributeValue | null> {
    return this.repository.findOne({
      where: { attributeId, id },
      withDeleted: options?.withDeleted === true,
    });
  }

  existsActiveByCode(
    attributeId: string,
    code: string,
    excludeId?: string,
  ): Promise<boolean> {
    const where: FindOptionsWhere<AttributeValue> = excludeId
      ? { attributeId, code, id: Not(excludeId) }
      : { attributeId, code };
    return this.repository.existsBy(where);
  }

  async findManyWithFilters(
    attributeId: string,
    query: ListAttributeValuesQueryDto,
  ): Promise<ListResponseDto<AttributeValue>> {
    query.normalize();
    const qb = this.createQueryBuilder('v');
    qb.andWhere('v.attribute_id = :attributeId', { attributeId });
    if (query.includeDeleted) {
      qb.withDeleted();
    }
    if (query.q) {
      qb.andWhere(
        '(LOWER(v.code) LIKE LOWER(:q) OR LOWER(v.name) LIKE LOWER(:q))',
        { q: `%${query.q}%` },
      );
    }
    if (query.active !== undefined) {
      qb.andWhere('v.active = :active', { active: query.active });
    }
    if (query.sort) {
      qb.orderBy('v.id', query.sort === SortOrder.ASC ? 'ASC' : 'DESC');
    } 
    qb.skip(query.skip).take(query.limit);
    const [data, total] = await qb.getManyAndCount();
    return ListResponseDto.create(data, total, query.page, query.limit);
  }

  async countVariantUsageByValueId(valueId: string): Promise<number> {
    return this.repository.manager.count(ProductVariantAttributeValue, {
      where: { attributeValueId: valueId },
    });
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
