import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryClosure } from '../../database/entities/category-closure.entity';
import { Category } from '../../database/entities/category.entity';
import { Product } from '../../database/entities/product.entity';
import { CategoriesController } from './categories.controller';
import { CategoriesRepository } from './repositories/categories.repository';
import { CategoryClosureService } from './services/category-closure.service';
import { CategoriesService } from './services/categories.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category, CategoryClosure, Product])],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRepository, CategoryClosureService],
  exports: [CategoriesService, CategoriesRepository, CategoryClosureService],
})
export class CategoriesModule {}
