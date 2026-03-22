import { Injectable } from '@nestjs/common';
import {
  AttributeCodeDuplicateException,
  AttributeHasValuesException,
  AttributeNotFoundException,
} from '../../../common/exceptions/attribute.exceptions';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { AttributeResponseDto } from '../dto/attribute-response.dto';
import { CreateAttributeDto } from '../dto/create-attribute.dto';
import { ListAttributesQueryDto } from '../dto/list-attributes-query.dto';
import { UpdateAttributeDto } from '../dto/update-attribute.dto';
import { AttributesRepository } from '../repositories/attributes.repository';

@Injectable()
export class AttributesService {
  constructor(private readonly attributesRepo: AttributesRepository) {}

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
  ): Promise<AttributeResponseDto> {
    const entity = await this.attributesRepo.findById(id, {
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
    if (await this.attributesRepo.existsActiveByCode(code)) {
      throw new AttributeCodeDuplicateException();
    }
    const saved = await this.attributesRepo.createAndSave({
      code,
      name,
      active: dto.active ?? true,
    });
    return AttributeResponseDto.fromEntity(saved);
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
