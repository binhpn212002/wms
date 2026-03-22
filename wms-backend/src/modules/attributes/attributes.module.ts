import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attribute } from '../../database/entities/attribute.entity';
import { AttributesController } from './attributes.controller';
import { AttributesRepository } from './repositories/attributes.repository';
import { AttributesService } from './services/attributes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Attribute])],
  controllers: [AttributesController],
  providers: [AttributesService, AttributesRepository],
  exports: [AttributesService, AttributesRepository],
})
export class AttributesModule {}
