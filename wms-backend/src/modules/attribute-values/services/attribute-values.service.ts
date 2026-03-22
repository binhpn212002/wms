import { Injectable } from '@nestjs/common';
import { AttributeNotFoundException } from '../../../common/exceptions/attribute.exceptions';
import {
  AttributeValueCodeDuplicateException,
  AttributeValueInUseException,
  AttributeValueNotFoundException,
} from '../../../common/exceptions/attribute-value.exceptions';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { AttributesRepository } from '../../attributes/repositories/attributes.repository';
import { AttributeValueResponseDto } from '../dto/attribute-value-response.dto';
import { CreateAttributeValueDto } from '../dto/create-attribute-value.dto';
import { ListAttributeValuesQueryDto } from '../dto/list-attribute-values-query.dto';
import { UpdateAttributeValueDto } from '../dto/update-attribute-value.dto';
import { AttributeValuesRepository } from '../repositories/attribute-values.repository';

@Injectable()
export class AttributeValuesService {
  constructor(
    private readonly attributeValuesRepo: AttributeValuesRepository,
    private readonly attributesRepo: AttributesRepository,
  ) {}

  private async assertAttributeActive(attributeId: string): Promise<void> {
    const attr = await this.attributesRepo.findById(attributeId);
    if (!attr || attr.deletedAt) {
      throw new AttributeNotFoundException();
    }
  }

  async list(
    attributeId: string,
    query: ListAttributeValuesQueryDto,
  ): Promise<ListResponseDto<AttributeValueResponseDto>> {
    await this.assertAttributeActive(attributeId);
    const res = await this.attributeValuesRepo.findManyWithFilters(
      attributeId,
      query,
    );
    return ListResponseDto.create<AttributeValueResponseDto>(
      res.data.map(AttributeValueResponseDto.fromEntity),
      res.total,
      res.page,
      res.limit,
    );
  }

  async findOne(
    attributeId: string,
    id: string,
    includeDeleted?: boolean,
  ): Promise<AttributeValueResponseDto> {
    await this.assertAttributeActive(attributeId);
    const entity = await this.attributeValuesRepo.findByIdForAttribute(
      attributeId,
      id,
      { withDeleted: includeDeleted },
    );
    if (!entity) {
      throw new AttributeValueNotFoundException();
    }
    if (!includeDeleted && entity.deletedAt) {
      throw new AttributeValueNotFoundException();
    }
    return AttributeValueResponseDto.fromEntity(entity);
  }

  async create(
    attributeId: string,
    dto: CreateAttributeValueDto,
  ): Promise<AttributeValueResponseDto> {
    await this.assertAttributeActive(attributeId);
    const code = dto.code.trim();
    const name = dto.name.trim();
    if (await this.attributeValuesRepo.existsActiveByCode(attributeId, code)) {
      throw new AttributeValueCodeDuplicateException();
    }
    const saved = await this.attributeValuesRepo.createAndSave({
      attributeId,
      code,
      name,
      active: dto.active ?? true,
    });
    return AttributeValueResponseDto.fromEntity(saved);
  }

  async update(
    attributeId: string,
    id: string,
    dto: UpdateAttributeValueDto,
  ): Promise<AttributeValueResponseDto> {
    await this.assertAttributeActive(attributeId);
    const entity = await this.attributeValuesRepo.findByIdForAttribute(
      attributeId,
      id,
    );
    if (!entity) {
      throw new AttributeValueNotFoundException();
    }
    if (dto.code !== undefined) {
      const nextCode = dto.code.trim();
      if (
        await this.attributeValuesRepo.existsActiveByCode(
          attributeId,
          nextCode,
          id,
        )
      ) {
        throw new AttributeValueCodeDuplicateException();
      }
      entity.code = nextCode;
    }
    if (dto.name !== undefined) {
      entity.name = dto.name.trim();
    }
    if (dto.active !== undefined) {
      entity.active = dto.active;
    }
    const saved = await this.attributeValuesRepo.save(entity);
    return AttributeValueResponseDto.fromEntity(saved);
  }

  async remove(attributeId: string, id: string): Promise<void> {
    await this.assertAttributeActive(attributeId);
    const entity = await this.attributeValuesRepo.findByIdForAttribute(
      attributeId,
      id,
      { withDeleted: true },
    );
    if (!entity) {
      throw new AttributeValueNotFoundException();
    }
    if (entity.deletedAt) {
      return;
    }
    const usage = await this.attributeValuesRepo.countVariantUsageByValueId(id);
    if (usage > 0) {
      throw new AttributeValueInUseException();
    }
    await this.attributeValuesRepo.softDeleteById(id);
  }
}
