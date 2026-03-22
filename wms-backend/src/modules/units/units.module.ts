import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../database/entities/product.entity';
import { Unit } from '../../database/entities/unit.entity';
import { UnitsRepository } from './repositories/units.repository';
import { UnitsService } from './services/units.service';
import { UnitsController } from './units.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Unit, Product])],
  controllers: [UnitsController],
  providers: [UnitsService, UnitsRepository],
  exports: [UnitsService, UnitsRepository],
})
export class UnitsModule {}
