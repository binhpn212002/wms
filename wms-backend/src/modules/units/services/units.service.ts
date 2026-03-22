import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UnitCodeDuplicateException,
  UnitInUseException,
  UnitNotFoundException,
} from '../../../common/exceptions/unit.exceptions';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { CreateUnitDto } from '../dto/create-unit.dto';
import { ListUnitsQueryDto } from '../dto/list-units-query.dto';
import { UnitResponseDto } from '../dto/unit-response.dto';
import { UpdateUnitDto } from '../dto/update-unit.dto';
import { Product } from '../../../database/entities/product.entity';
import { UnitsRepository } from '../repositories/units.repository';

@Injectable()
export class UnitsService {
  constructor(
    private readonly unitsRepo: UnitsRepository,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  private async countProductsByDefaultUomId(unitId: string): Promise<number> {
    return this.productRepo.count({ where: { defaultUomId: unitId } });
  }

  async list(
    query: ListUnitsQueryDto,
  ): Promise<ListResponseDto<UnitResponseDto>> {
    const res = await this.unitsRepo.findManyWithFilters(query);
    return ListResponseDto.create<UnitResponseDto>(
      res.data.map(UnitResponseDto.fromEntity),
      res.total,
      res.page,
      res.limit,
    );
  }

  async findOne(
    id: string,
    includeDeleted?: boolean,
  ): Promise<UnitResponseDto> {
    const entity = await this.unitsRepo.findById(id, {
      withDeleted: includeDeleted,
    });
    if (!entity) {
      throw new UnitNotFoundException();
    }
    if (!includeDeleted && entity.deletedAt) {
      throw new UnitNotFoundException();
    }
    return UnitResponseDto.fromEntity(entity);
  }

  async create(dto: CreateUnitDto): Promise<UnitResponseDto> {
    const code = dto.code.trim().toUpperCase();
    const name = dto.name.trim();
    if (await this.unitsRepo.existsActiveByCode(code)) {
      throw new UnitCodeDuplicateException();
    }
    const symbol =
      dto.symbol !== undefined && dto.symbol !== null
        ? dto.symbol.trim() || null
        : null;
    const saved = await this.unitsRepo.createAndSave({
      code,
      name,
      symbol,
      active: dto.active ?? true,
    });
    return UnitResponseDto.fromEntity(saved);
  }

  async update(id: string, dto: UpdateUnitDto): Promise<UnitResponseDto> {
    const entity = await this.unitsRepo.findById(id);
    if (!entity) {
      throw new UnitNotFoundException();
    }
    if (dto.code !== undefined) {
      const nextCode = dto.code.trim().toUpperCase();
      if (await this.unitsRepo.existsActiveByCode(nextCode, id)) {
        throw new UnitCodeDuplicateException();
      }
      entity.code = nextCode;
    }
    if (dto.name !== undefined) {
      entity.name = dto.name.trim();
    }
    if (dto.symbol !== undefined) {
      const t = dto.symbol?.trim();
      entity.symbol = t === undefined || t === '' ? null : t;
    }
    if (dto.active !== undefined) {
      entity.active = dto.active;
    }
    const saved = await this.unitsRepo.save(entity);
    return UnitResponseDto.fromEntity(saved);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.unitsRepo.findById(id, {
      withDeleted: true,
    });
    if (!entity) {
      throw new UnitNotFoundException();
    }
    if (entity.deletedAt) {
      return;
    }
    const productCount = await this.countProductsByDefaultUomId(id);
    if (productCount > 0) {
      throw new UnitInUseException();
    }
    await this.unitsRepo.softDeleteById(id);
  }
}
