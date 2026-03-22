import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboundDocument } from '../../database/entities/outbound-document.entity';
import { OutboundLine } from '../../database/entities/outbound-line.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductsModule } from '../products/products.module';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { OutboundController } from './outbound.controller';
import { OutboundDocumentsRepository } from './repositories/outbound-documents.repository';
import { OutboundLinesRepository } from './repositories/outbound-lines.repository';
import { OutboundService } from './services/outbound.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OutboundDocument, OutboundLine]),
    InventoryModule,
    WarehousesModule,
    ProductsModule,
  ],
  controllers: [OutboundController],
  providers: [
    OutboundService,
    OutboundDocumentsRepository,
    OutboundLinesRepository,
  ],
})
export class OutboundModule {}
