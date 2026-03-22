import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from '../../database/entities/location.entity';
import { Warehouse } from '../../database/entities/warehouse.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { LocationsRepository } from './repositories/locations.repository';
import { WarehousesRepository } from './repositories/warehouses.repository';
import { LocationsService } from './services/locations.service';
import { WarehousesService } from './services/warehouses.service';
import { LocationsController } from './locations.controller';
import { WarehousesController } from './warehouses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse, Location]), InventoryModule],
  controllers: [WarehousesController, LocationsController],
  providers: [
    WarehousesService,
    LocationsService,
    WarehousesRepository,
    LocationsRepository,
  ],
  exports: [
    WarehousesService,
    LocationsService,
    WarehousesRepository,
    LocationsRepository,
  ],
})
export class WarehousesModule {}
