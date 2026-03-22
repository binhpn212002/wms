import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeValue } from '../../database/entities/attribute-value.entity';
import { ProductVariantAttributeValue } from '../../database/entities/product-variant-attribute-value.entity';
import { AttributesModule } from '../attributes/attributes.module';
import { AttributeValuesController } from './attribute-values.controller';
import { AttributeValuesRepository } from './repositories/attribute-values.repository';
import { AttributeValuesService } from './services/attribute-values.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttributeValue, ProductVariantAttributeValue]),
    AttributesModule,
  ],
  controllers: [AttributeValuesController],
  providers: [AttributeValuesService, AttributeValuesRepository],
  exports: [AttributeValuesService, AttributeValuesRepository],
})
export class AttributeValuesModule {}
