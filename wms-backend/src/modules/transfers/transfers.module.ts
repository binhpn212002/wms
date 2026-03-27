import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transfer } from '../../database/entities/transfer.entity';
import { TransferLine } from '../../database/entities/transfer-line.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductsModule } from '../products/products.module';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { TransferLinesRepository } from './repositories/transfer-lines.repository';
import { TransfersRepository } from './repositories/transfers.repository';
import { TransfersService } from './services/transfers.service';
import { TransfersController } from './transfers.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transfer, TransferLine]),
    InventoryModule,
    WarehousesModule,
    ProductsModule,
  ],
  controllers: [TransfersController],
  providers: [
    TransfersService,
    TransfersRepository,
    TransferLinesRepository,
  ],
})
export class TransfersModule {}

