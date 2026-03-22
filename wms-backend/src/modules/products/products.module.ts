import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeValue } from '../../database/entities/attribute-value.entity';
import { Category } from '../../database/entities/category.entity';
import { ProductVariantAttributeValue } from '../../database/entities/product-variant-attribute-value.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { Product } from '../../database/entities/product.entity';
import { Unit } from '../../database/entities/unit.entity';
import { ProductVariantsRepository } from './repositories/product-variants.repository';
import { ProductsRepository } from './repositories/products.repository';
import { ProductsController } from './products.controller';
import { ProductsService } from './services/products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductVariant,
      ProductVariantAttributeValue,
      Category,
      Unit,
      AttributeValue,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository, ProductVariantsRepository],
  exports: [ProductsService, ProductsRepository, ProductVariantsRepository],
})
export class ProductsModule {}
