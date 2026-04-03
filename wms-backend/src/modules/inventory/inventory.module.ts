import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryMovement } from '../../database/entities/inventory-movement.entity';
import { Location } from '../../database/entities/location.entity';
import { Product } from '../../database/entities/product.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { StockBalance } from '../../database/entities/stock-balance.entity';
import { Warehouse } from '../../database/entities/warehouse.entity';
import { InventoryCheckController } from './inventory-check.controller';
import { InventoryController } from './inventory.controller';
import { InventoryMovementsRepository } from './repositories/inventory-movements.repository';
import { StockBalancesRepository } from './repositories/stock-balances.repository';
import { InventoryCheckService } from './services/inventory-check.service';
import { InventoryStockService } from './services/inventory-stock.service';
import { InventoryService } from './services/inventory.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockBalance,
      InventoryMovement,
      Warehouse,
      Location,
      ProductVariant,
      Product,
    ]),
  ],
  controllers: [InventoryController, InventoryCheckController],
  providers: [
    InventoryService,
    InventoryCheckService,
    InventoryStockService,
    StockBalancesRepository,
    InventoryMovementsRepository,
  ],
  exports: [InventoryService, InventoryStockService, StockBalancesRepository],
})
export class InventoryModule {}
