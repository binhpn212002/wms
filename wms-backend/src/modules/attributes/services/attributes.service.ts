import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AttributeValueCodeDuplicateException } from '../../../common/exceptions/attribute-value.exceptions';
import {
  AttributeCodeDuplicateException,
  AttributeHasValuesException,
  AttributeNotFoundException,
} from '../../../common/exceptions/attribute.exceptions';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { AttributeValue } from '../../../database/entities/attribute-value.entity';
import { Attribute } from '../../../database/entities/attribute.entity';
import { AttributeResponseDto } from '../dto/attribute-response.dto';
import { CreateAttributeDto } from '../dto/create-attribute.dto';
import { ListAttributesQueryDto } from '../dto/list-attributes-query.dto';
import { UpdateAttributeDto } from '../dto/update-attribute.dto';
import { AttributesRepository } from '../repositories/attributes.repository';

@Injectable()
export class AttributesService {
  constructor(
    private readonly attributesRepo: AttributesRepository,
    private readonly dataSource: DataSource,
  ) {}

  async list(
    query: ListAttributesQueryDto,
  ): Promise<ListResponseDto<AttributeResponseDto>> {
    const res = await this.attributesRepo.findManyWithFilters(query);
    return ListResponseDto.create<AttributeResponseDto>(
      res.data.map(AttributeResponseDto.fromEntity),
      res.total,
      res.page,
      res.limit,
    );
  }

  async findOne(
    id: string,
    includeDeleted?: boolean,
    includeValues?: boolean,
  ): Promise<AttributeResponseDto> {
    const entity = includeValues
      ? await this.attributesRepo.findByIdWithValues(id, {
          withDeleted: includeDeleted,
        })
      : await this.attributesRepo.findById(id, {
          withDeleted: includeDeleted,
        });
    if (!entity) {
      throw new AttributeNotFoundException();
    }
    if (!includeDeleted && entity.deletedAt) {
      throw new AttributeNotFoundException();
    }
    return AttributeResponseDto.fromEntity(entity);
  }

  async create(dto: CreateAttributeDto): Promise<AttributeResponseDto> {
    const code = dto.code.trim();
    const name = dto.name.trim();
    const normalizedValues =
      dto.values?.map((v) => ({
        code: v.code.trim(),
        name: v.name.trim(),
        active: v.active ?? true,
      })) ?? [];

    return this.dataSource.transaction(async (manager) => {
      const attrRepo = manager.getRepository(Attribute);
      const valRepo = manager.getRepository(AttributeValue);

      if (await attrRepo.existsBy({ code })) {
        throw new AttributeCodeDuplicateException();
      }

      const attr = attrRepo.create({
        code,
        name,
        active: dto.active ?? true,
      });
      const saved = await attrRepo.save(attr);

      if (normalizedValues.length > 0) {
        const seenCodes = new Set<string>();
        for (const v of normalizedValues) {
          if (seenCodes.has(v.code)) {
            throw new AttributeValueCodeDuplicateException();
          }
          seenCodes.add(v.code);
        }

        const rows = normalizedValues.map((v) =>
          valRepo.create({
            attributeId: saved.id,
            code: v.code,
            name: v.name,
            active: v.active,
          }),
        );
        await valRepo.save(rows);
      }

      return AttributeResponseDto.fromEntity(saved);
    });
  }

  async update(
    id: string,
    dto: UpdateAttributeDto,
  ): Promise<AttributeResponseDto> {
    const entity = await this.attributesRepo.findById(id);
    if (!entity) {
      throw new AttributeNotFoundException();
    }
    if (dto.code !== undefined) {
      const nextCode = dto.code.trim();
      if (await this.attributesRepo.existsActiveByCode(nextCode, id)) {
        throw new AttributeCodeDuplicateException();
      }
      entity.code = nextCode;
    }
    if (dto.name !== undefined) {
      entity.name = dto.name.trim();
    }
    if (dto.active !== undefined) {
      entity.active = dto.active;
    }
    const saved = await this.attributesRepo.save(entity);
    return AttributeResponseDto.fromEntity(saved);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.attributesRepo.findById(id, {
      withDeleted: true,
    });
    if (!entity) {
      throw new AttributeNotFoundException();
    }
    if (entity.deletedAt) {
      return;
    }
    const valueCount = await this.attributesRepo.countValuesByAttributeId(id);
    if (valueCount > 0) {
      throw new AttributeHasValuesException();
    }
    await this.attributesRepo.softDeleteById(id);
  }
}
