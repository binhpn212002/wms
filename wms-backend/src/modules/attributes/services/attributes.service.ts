import { Injectable } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import {
  AttributeCodeDuplicateException,
  AttributeHasValuesException,
  AttributeNotFoundException,
} from '../../../common/exceptions/attribute.exceptions';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { Attribute } from '../../../database/entities/attribute.entity';
import { AttributeResponseDto } from '../dto/attribute-response.dto';
import { CreateAttributeDto } from '../dto/create-attribute.dto';
import { ListAttributesQueryDto } from '../dto/list-attributes-query.dto';
import { UpdateAttributeDto } from '../dto/update-attribute.dto';
import { AttributesRepository } from '../repositories/attributes.repository';

function isPgUniqueViolation(err: unknown): boolean {
  return (
    err instanceof QueryFailedError &&
    (err as QueryFailedError & { driverError?: { code?: string } }).driverError
      ?.code === '23505'
  );
}

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
    return await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Attribute);
      const entity = repo.create({
        code,
        name,
        sortOrder: dto.sort_order ?? null,
        active: dto.active ?? true,
      });
      let saved: Attribute;
      try {
        saved = await repo.save(entity);
      } catch (e) {
        if (isPgUniqueViolation(e)) {
          throw new AttributeCodeDuplicateException();
        }
        throw e;
      }
      return AttributeResponseDto.fromEntity(saved);
    });
  }

  async update(
    id: string,
    dto: UpdateAttributeDto,
  ): Promise<AttributeResponseDto> {
    return await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Attribute);
      const entity = await repo.findOne({ where: { id } });
      if (!entity) {
        throw new AttributeNotFoundException();
      }
      if (dto.code !== undefined) {
        entity.code = dto.code.trim();
      }
      if (dto.name !== undefined) {
        entity.name = dto.name.trim();
      }
      if (dto.sort_order !== undefined) {
        entity.sortOrder = dto.sort_order;
      }
      if (dto.active !== undefined) {
        entity.active = dto.active;
      }
      let saved: Attribute;
      try {
        saved = await repo.save(entity);
      } catch (e) {
        if (isPgUniqueViolation(e)) {
          throw new AttributeCodeDuplicateException();
        }
        throw e;
      }
      return AttributeResponseDto.fromEntity(saved);
    });
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
