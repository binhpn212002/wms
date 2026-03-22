import { Injectable } from '@nestjs/common';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { StockBalance } from '../../../database/entities/stock-balance.entity';
import { InventoryMovement } from '../../../database/entities/inventory-movement.entity';
import { ListBalancesQueryDto } from '../dto/list-balances-query.dto';
import { ListInventoryMovementsQueryDto } from '../dto/list-inventory-movements-query.dto';
import { InventoryMovementItemDto } from '../dto/inventory-movement-response.dto';
import { StockBalanceItemDto } from '../dto/stock-balance-response.dto';
import { SummaryQueryDto } from '../dto/summary-query.dto';
import {
  SummaryByProductItemDto,
  SummaryByWarehouseItemDto,
} from '../dto/summary-response.dto';
import { InventoryMovementsRepository } from '../repositories/inventory-movements.repository';
import { StockBalancesRepository } from '../repositories/stock-balances.repository';

@Injectable()
export class InventoryService {
  constructor(
    private readonly stockBalancesRepository: StockBalancesRepository,
    private readonly inventoryMovementsRepository: InventoryMovementsRepository,
  ) {}

  private mapBalance(b: StockBalance): StockBalanceItemDto {
    return {
      id: b.id,
      warehouseId: b.warehouseId,
      warehouseCode: b.warehouse?.code,
      warehouseName: b.warehouse?.name,
      locationId: b.locationId,
      locationCode: b.location?.code,
      variantId: b.variantId,
      sku: b.variant?.sku ?? '',
      productId: b.variant?.productId ?? '',
      productCode: b.variant?.product?.code ?? '',
      productName: b.variant?.product?.name ?? '',
      quantity: String(b.quantity),
      updatedAt: b.updatedAt,
    };
  }

  private mapMovement(m: InventoryMovement): InventoryMovementItemDto {
    return {
      id: m.id,
      warehouseId: m.warehouseId,
      locationId: m.locationId,
      variantId: m.variantId,
      quantityDelta: String(m.quantityDelta),
      movementType: m.movementType,
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      referenceLineId: m.referenceLineId,
      createdAt: m.createdAt,
    };
  }

  async listBalances(
    query: ListBalancesQueryDto,
  ): Promise<ListResponseDto<StockBalanceItemDto>> {
    const res = await this.stockBalancesRepository.findManyWithFilters(query);
    return ListResponseDto.create(
      res.data.map((b) => this.mapBalance(b)),
      res.total,
      res.page,
      res.limit,
    );
  }

  async summaryByProduct(
    query: SummaryQueryDto,
  ): Promise<ListResponseDto<SummaryByProductItemDto>> {
    return this.stockBalancesRepository.summaryByProduct(query);
  }

  async summaryByWarehouse(
    query: SummaryQueryDto,
  ): Promise<ListResponseDto<SummaryByWarehouseItemDto>> {
    return this.stockBalancesRepository.summaryByWarehouse(query);
  }

  async listMovements(
    query: ListInventoryMovementsQueryDto,
  ): Promise<ListResponseDto<InventoryMovementItemDto>> {
    const res =
      await this.inventoryMovementsRepository.findManyWithFilters(query);
    return ListResponseDto.create(
      res.data.map((m) => this.mapMovement(m)),
      res.total,
      res.page,
      res.limit,
    );
  }
}
