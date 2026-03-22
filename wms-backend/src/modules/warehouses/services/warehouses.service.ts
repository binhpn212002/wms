import { Injectable } from '@nestjs/common';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { LocationType } from '../../../common/constants/inventory.constant';
import {
  LocationNotFoundException,
  LocationWarehouseMismatchException,
  WarehouseNotFoundException,
} from '../../../common/exceptions/inventory.exceptions';
import {
  DefaultLocationMustBeBinException,
  InvalidLocationTypeException,
  LocationCodeDuplicateException,
  LocationParentInvalidException,
  WarehouseCodeDuplicateException,
  WarehouseHasStockException,
} from '../../../common/exceptions/warehouse.exceptions';
import { Location } from '../../../database/entities/location.entity';
import { StockBalancesRepository } from '../../inventory/repositories/stock-balances.repository';
import { LOCATION_TYPES } from '../constants/location-types';
import { CreateLocationDto } from '../dto/create-location.dto';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { GetWarehouseQueryDto } from '../dto/get-warehouse-query.dto';
import {
  ListLocationsQueryDto,
  LocationsView,
} from '../dto/list-locations-query.dto';
import { ListWarehousesQueryDto } from '../dto/list-warehouses-query.dto';
import { LocationResponseDto } from '../dto/location-response.dto';
import { UpdateWarehouseDto } from '../dto/update-warehouse.dto';
import { WarehouseResponseDto } from '../dto/warehouse-response.dto';
import { LocationsRepository } from '../repositories/locations.repository';
import { WarehousesRepository } from '../repositories/warehouses.repository';

@Injectable()
export class WarehousesService {
  constructor(
    private readonly warehousesRepo: WarehousesRepository,
    private readonly locationsRepo: LocationsRepository,
    private readonly stockBalancesRepo: StockBalancesRepository,
  ) {}

  async list(
    query: ListWarehousesQueryDto,
  ): Promise<ListResponseDto<WarehouseResponseDto>> {
    const res = await this.warehousesRepo.findManyWithFilters(query);
    const data = res.data.map((w) => WarehouseResponseDto.fromEntity(w));
    return ListResponseDto.create(data, res.total, res.page, res.limit);
  }

  async findOne(
    id: string,
    query: GetWarehouseQueryDto,
  ): Promise<WarehouseResponseDto> {
    const withDeleted = query.includeDeleted === true;
    const w = await this.warehousesRepo.findById(id, { withDeleted });
    if (!w || (!withDeleted && w.deletedAt)) {
      throw new WarehouseNotFoundException();
    }
    return WarehouseResponseDto.fromEntity(w);
  }

  async create(dto: CreateWarehouseDto): Promise<WarehouseResponseDto> {
    const code = dto.code.trim();
    if (await this.warehousesRepo.existsActiveByCode(code)) {
      throw new WarehouseCodeDuplicateException();
    }
    const entity = await this.warehousesRepo.createAndSave({
      code,
      name: dto.name.trim(),
      address: dto.address?.trim() ?? null,
      active: dto.active ?? true,
      defaultLocationId: null,
    });
    return WarehouseResponseDto.fromEntity(entity);
  }

  async update(
    id: string,
    dto: UpdateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    const w = await this.warehousesRepo.findById(id);
    if (!w || w.deletedAt) {
      throw new WarehouseNotFoundException();
    }
    if (dto.name !== undefined) {
      w.name = dto.name.trim();
    }
    if (dto.address !== undefined) {
      w.address = dto.address;
    }
    if (dto.active !== undefined) {
      w.active = dto.active;
    }
    if (dto.defaultLocationId !== undefined) {
      await this.assertDefaultLocation(id, dto.defaultLocationId);
      w.defaultLocationId = dto.defaultLocationId;
    }
    await this.warehousesRepo.save(w);
    return this.findOne(id, {});
  }

  async remove(id: string): Promise<void> {
    const w = await this.warehousesRepo.findById(id);
    if (!w || w.deletedAt) {
      throw new WarehouseNotFoundException();
    }
    if (await this.stockBalancesRepo.existsPositiveQuantityInWarehouse(id)) {
      throw new WarehouseHasStockException();
    }
    await this.warehousesRepo.softDeleteById(id);
  }

  async listLocations(
    warehouseId: string,
    query: ListLocationsQueryDto,
  ): Promise<
    | ListResponseDto<LocationResponseDto>
    | { view: 'tree'; data: LocationResponseDto[] }
  > {
    const w = await this.warehousesRepo.findById(warehouseId);
    if (!w || w.deletedAt) {
      throw new WarehouseNotFoundException();
    }

    if (query.view === LocationsView.TREE) {
      const rows = await this.locationsRepo.findByWarehouseId(warehouseId, {
        includeDeleted: query.includeDeleted === true,
      });
      const filtered =
        query.includeDeleted === true ? rows : rows.filter((l) => !l.deletedAt);
      return { view: 'tree', data: this.buildLocationTree(filtered) };
    }

    const res = await this.locationsRepo.findManyWithFilters(
      warehouseId,
      query,
    );
    const data = res.data.map((l) => LocationResponseDto.fromEntity(l));
    return ListResponseDto.create(data, res.total, res.page, res.limit);
  }

  async createLocation(
    warehouseId: string,
    dto: CreateLocationDto,
  ): Promise<LocationResponseDto> {
    const w = await this.warehousesRepo.findById(warehouseId);
    if (!w || w.deletedAt) {
      throw new WarehouseNotFoundException();
    }

    const code = dto.code.trim();
    if (
      await this.locationsRepo.existsActiveByWarehouseAndCode(warehouseId, code)
    ) {
      throw new LocationCodeDuplicateException();
    }

    const type = dto.type.trim().toLowerCase();
    if (!LOCATION_TYPES.includes(type as (typeof LOCATION_TYPES)[number])) {
      throw new InvalidLocationTypeException();
    }

    const parentId: string | null = dto.parentId ?? null;
    if (parentId) {
      const parent = await this.locationsRepo.findById(parentId);
      if (!parent || parent.deletedAt || parent.warehouseId !== warehouseId) {
        throw new LocationParentInvalidException();
      }
    }

    const entity = await this.locationsRepo.createAndSave({
      warehouseId,
      parentId,
      type,
      code,
      name: dto.name?.trim() ?? null,
    });
    return LocationResponseDto.fromEntity(entity);
  }

  private buildLocationTree(locations: Location[]): LocationResponseDto[] {
    const childrenByParent = new Map<string | null, Location[]>();
    for (const l of locations) {
      const key = l.parentId;
      const arr = childrenByParent.get(key) ?? [];
      arr.push(l);
      childrenByParent.set(key, arr);
    }
    const sortByCode = (a: Location, b: Location) =>
      a.code.localeCompare(b.code, undefined, { sensitivity: 'base' });

    const toDto = (l: Location): LocationResponseDto => {
      const kids = (childrenByParent.get(l.id) ?? [])
        .sort(sortByCode)
        .map(toDto);
      return LocationResponseDto.fromEntity(l, {
        children: kids.length ? kids : undefined,
      });
    };

    const roots = (childrenByParent.get(null) ?? []).sort(sortByCode);
    return roots.map(toDto);
  }

  private async assertDefaultLocation(
    warehouseId: string,
    locationId: string | null,
  ): Promise<void> {
    if (locationId === null) {
      return;
    }
    const loc = await this.locationsRepo.findById(locationId);
    if (!loc || loc.deletedAt) {
      throw new LocationNotFoundException();
    }
    if (loc.warehouseId !== warehouseId) {
      throw new LocationWarehouseMismatchException();
    }
    if (loc.type !== LocationType.BIN) {
      throw new DefaultLocationMustBeBinException();
    }
  }
}
