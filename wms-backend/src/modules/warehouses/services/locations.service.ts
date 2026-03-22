import { Injectable } from '@nestjs/common';
import { LocationType } from '../../../common/constants/inventory.constant';
import { LocationNotFoundException } from '../../../common/exceptions/inventory.exceptions';
import {
  InvalidLocationTypeException,
  LocationCodeDuplicateException,
  LocationHasChildrenException,
  LocationHasStockException,
  LocationIsDefaultForWarehouseException,
  LocationParentCycleException,
  LocationParentInvalidException,
  LocationSubtreeHasStockException,
} from '../../../common/exceptions/warehouse.exceptions';
import { Location } from '../../../database/entities/location.entity';
import { StockBalancesRepository } from '../../inventory/repositories/stock-balances.repository';
import { LOCATION_TYPES } from '../constants/location-types';
import { GetLocationQueryDto } from '../dto/get-location-query.dto';
import { LocationResponseDto } from '../dto/location-response.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { LocationsRepository } from '../repositories/locations.repository';
import { WarehousesRepository } from '../repositories/warehouses.repository';

@Injectable()
export class LocationsService {
  constructor(
    private readonly locationsRepo: LocationsRepository,
    private readonly warehousesRepo: WarehousesRepository,
    private readonly stockBalancesRepo: StockBalancesRepository,
  ) {}

  async findOne(
    id: string,
    query: GetLocationQueryDto,
  ): Promise<LocationResponseDto> {
    const withDeleted = query.includeDeleted === true;
    const loc = await this.locationsRepo.findById(id, { withDeleted });
    if (!loc || (!withDeleted && loc.deletedAt)) {
      throw new LocationNotFoundException();
    }
    return LocationResponseDto.fromEntity(loc);
  }

  async update(
    id: string,
    dto: UpdateLocationDto,
  ): Promise<LocationResponseDto> {
    const loc = await this.locationsRepo.findById(id);
    if (!loc || loc.deletedAt) {
      throw new LocationNotFoundException();
    }

    const warehouseId = loc.warehouseId;
    const allInWarehouse =
      await this.locationsRepo.findActiveByWarehouseId(warehouseId);
    const byId = new Map(allInWarehouse.map((l) => [l.id, l]));

    if (dto.code !== undefined) {
      const code = dto.code.trim();
      if (
        await this.locationsRepo.existsActiveByWarehouseAndCode(
          warehouseId,
          code,
          id,
        )
      ) {
        throw new LocationCodeDuplicateException();
      }
      loc.code = code;
    }

    if (dto.name !== undefined) {
      loc.name = dto.name === null ? null : dto.name.trim() || null;
    }

    if (dto.type !== undefined) {
      const type = dto.type.trim().toLowerCase();
      if (!LOCATION_TYPES.includes(type as (typeof LOCATION_TYPES)[number])) {
        throw new InvalidLocationTypeException();
      }
      if (type !== loc.type && type !== LocationType.BIN) {
        const hasStock =
          await this.stockBalancesRepo.existsPositiveQuantityAtLocation(id);
        if (hasStock) {
          throw new LocationHasStockException();
        }
      }
      loc.type = type;
    }

    if (dto.parentId !== undefined) {
      const newParentId = dto.parentId;
      if (newParentId !== null) {
        const parent = await this.locationsRepo.findById(newParentId);
        if (!parent || parent.deletedAt || parent.warehouseId !== warehouseId) {
          throw new LocationParentInvalidException();
        }
      }
      if (this.wouldCreateCycle(id, newParentId, byId)) {
        throw new LocationParentCycleException();
      }
      if (newParentId !== loc.parentId) {
        const selfAndDesc = [
          id,
          ...this.collectDescendantIds(allInWarehouse, id),
        ];
        if (
          await this.stockBalancesRepo.existsPositiveQuantityAtAnyLocations(
            selfAndDesc,
          )
        ) {
          throw new LocationSubtreeHasStockException();
        }
      }
      loc.parentId = newParentId;
    }

    await this.locationsRepo.save(loc);
    return LocationResponseDto.fromEntity(loc);
  }

  async remove(id: string): Promise<void> {
    const loc = await this.locationsRepo.findById(id);
    if (!loc || loc.deletedAt) {
      throw new LocationNotFoundException();
    }

    if (await this.warehousesRepo.isDefaultLocationForAnyWarehouse(id)) {
      throw new LocationIsDefaultForWarehouseException();
    }

    if ((await this.locationsRepo.countActiveChildren(id)) > 0) {
      throw new LocationHasChildrenException();
    }

    if (await this.stockBalancesRepo.existsPositiveQuantityAtLocation(id)) {
      throw new LocationHasStockException();
    }

    await this.locationsRepo.softDeleteById(id);
  }

  private collectDescendantIds(all: Location[], rootId: string): string[] {
    const byParent = new Map<string, string[]>();
    for (const l of all) {
      if (l.parentId === null) {
        continue;
      }
      const arr = byParent.get(l.parentId) ?? [];
      arr.push(l.id);
      byParent.set(l.parentId, arr);
    }
    const out: string[] = [];
    const stack = [...(byParent.get(rootId) ?? [])];
    while (stack.length) {
      const cur = stack.pop()!;
      out.push(cur);
      const kids = byParent.get(cur);
      if (kids) {
        stack.push(...kids);
      }
    }
    return out;
  }

  private wouldCreateCycle(
    locationId: string,
    newParentId: string | null,
    byId: Map<string, Location>,
  ): boolean {
    if (newParentId === null) {
      return false;
    }
    let cur: string | null = newParentId;
    const seen = new Set<string>();
    while (cur) {
      if (cur === locationId) {
        return true;
      }
      if (seen.has(cur)) {
        return true;
      }
      seen.add(cur);
      const p = byId.get(cur);
      if (!p) {
        break;
      }
      cur = p.parentId;
    }
    return false;
  }
}
