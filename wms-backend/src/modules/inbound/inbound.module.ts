import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboundDocument } from '../../database/entities/inbound-document.entity';
import { InboundLine } from '../../database/entities/inbound-line.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductsModule } from '../products/products.module';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { InboundController } from './inbound.controller';
import { InboundDocumentsRepository } from './repositories/inbound-documents.repository';
import { InboundLinesRepository } from './repositories/inbound-lines.repository';
import { InboundService } from './services/inbound.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([InboundDocument, InboundLine]),
    InventoryModule,
    SuppliersModule,
    WarehousesModule,
    ProductsModule,
  ],
  controllers: [InboundController],
  providers: [
    InboundService,
    InboundDocumentsRepository,
    InboundLinesRepository,
  ],
})
export class InboundModule {}
