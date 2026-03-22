import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  CategoryCodeDuplicateException,
  CategoryHasChildrenException,
  CategoryHasProductsException,
  CategoryNotFoundException,
  CategoryParentCycleException,
  CategoryParentInvalidException,
} from '../../../common/exceptions/category.exceptions';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { Category } from '../../../database/entities/category.entity';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { ListCategoriesQueryDto } from '../dto/list-categories-query.dto';
import { TreeCategoriesQueryDto } from '../dto/tree-categories-query.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoriesRepository } from '../repositories/categories.repository';
import { CategoryClosureService } from './category-closure.service';

export interface CategoryTreeNode {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  children: CategoryTreeNode[];
}

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepo: CategoriesRepository,
    private readonly categoryClosureService: CategoryClosureService,
    private readonly dataSource: DataSource,
  ) {}

  /** Stub: bổ sung khi có module Product. */
  private async countProductsByCategoryId(categoryId: string): Promise<number> {
    void categoryId;
    return 0;
  }

  async list(
    query: ListCategoriesQueryDto,
  ): Promise<ListResponseDto<CategoryResponseDto>> {
    const res = await this.categoriesRepo.findManyWithFilters(query);
    const dto = ListResponseDto.create<CategoryResponseDto>(
      res.data.map(CategoryResponseDto.fromEntity),
      res.total,
      res.page,
      res.limit,
    );
    return dto;
  }

  async tree(query: TreeCategoriesQueryDto): Promise<CategoryTreeNode[]> {
    const rows = await this.categoriesRepo.findAllForTree(
      query.active,
      query.includeDeleted,
    );
    return this.buildTree(rows);
  }

  private buildTree(flat: Category[]): CategoryTreeNode[] {
    const nodes = new Map<string, CategoryTreeNode>();
    for (const e of flat) {
      nodes.set(e.id, {
        id: e.id,
        code: e.code,
        name: e.name,
        parent_id: e.parentId,
        active: e.active,
        created_at: e.createdAt,
        updated_at: e.updatedAt,
        children: [],
      });
    }
    const roots: CategoryTreeNode[] = [];
    for (const e of flat) {
      const n = nodes.get(e.id);
      if (!n) {
        continue;
      }
      const pId = e.parentId;
      if (pId && nodes.has(pId)) {
        nodes.get(pId).children.push(n);
      } else {
        roots.push(n);
      }
    }
    return roots;
  }

  async findOne(
    id: string,
    includeDeleted?: boolean,
  ): Promise<CategoryResponseDto> {
    const entity = await this.categoriesRepo.findById(id, {
      withDeleted: includeDeleted,
    });
    if (!entity) {
      throw new CategoryNotFoundException();
    }
    if (!includeDeleted && entity.deletedAt) {
      throw new CategoryNotFoundException();
    }
    return CategoryResponseDto.fromEntity(entity);
  }

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const code = dto.code.trim();
    const name = dto.name.trim();
    if (await this.categoriesRepo.existsActiveByCode(code)) {
      throw new CategoryCodeDuplicateException();
    }
    return await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Category);
      if (dto.parent_id) {
        const p = await repo.findOne({ where: { id: dto.parent_id } });
        if (!p) {
          throw new CategoryParentInvalidException();
        }
      }
      const entity = repo.create({
        code,
        name,
        parentId: dto.parent_id ?? null,
        active: dto.active ?? true,
      });
      const saved = await repo.save(entity);
      await this.categoryClosureService.rebuildWithManager(manager);
      return CategoryResponseDto.fromEntity(saved);
    });
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    if (dto.code !== undefined) {
      const nextCode = dto.code.trim();
      if (await this.categoriesRepo.existsActiveByCode(nextCode, id)) {
        throw new CategoryCodeDuplicateException();
      }
    }
    return await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Category);
      const entity = await repo.findOne({ where: { id } });
      if (!entity) {
        throw new CategoryNotFoundException();
      }
      const nextParentId =
        dto.parent_id !== undefined ? dto.parent_id : entity.parentId;
      if (nextParentId) {
        const p = await repo.findOne({ where: { id: nextParentId } });
        if (!p) {
          throw new CategoryParentInvalidException();
        }
        const descendants =
          await this.categoryClosureService.getDescendantIds(id);
        if (nextParentId === id || descendants.has(nextParentId)) {
          throw new CategoryParentCycleException();
        }
      }
      if (dto.code !== undefined) {
        entity.code = dto.code.trim();
      }
      if (dto.name !== undefined) {
        entity.name = dto.name.trim();
      }
      if (dto.parent_id !== undefined) {
        entity.parentId = dto.parent_id;
      }
      if (dto.active !== undefined) {
        entity.active = dto.active;
      }
      const saved = await repo.save(entity);
      await this.categoryClosureService.rebuildWithManager(manager);
      return CategoryResponseDto.fromEntity(saved);
    });
  }

  async remove(id: string): Promise<void> {
    const entity = await this.categoriesRepo.findById(id, {
      withDeleted: true,
    });
    if (!entity) {
      throw new CategoryNotFoundException();
    }
    if (entity.deletedAt) {
      return;
    }
    const childCount = await this.categoriesRepo.countDirectChildren(id);
    if (childCount > 0) {
      throw new CategoryHasChildrenException();
    }
    const productCount = await this.countProductsByCategoryId(id);
    if (productCount > 0) {
      throw new CategoryHasProductsException();
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(Category, { id });
      await this.categoryClosureService.rebuildWithManager(manager);
    });
  }
}
