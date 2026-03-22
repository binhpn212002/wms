import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, MoreThan, Repository } from 'typeorm';
import { CategoryClosure } from '../../../database/entities/category-closure.entity';
import { Category } from '../../../database/entities/category.entity';

@Injectable()
export class CategoryClosureService implements OnModuleInit {
  constructor(
    @InjectRepository(CategoryClosure)
    private readonly closureRepo: Repository<CategoryClosure>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly dataSource: DataSource,
  ) {}

  /** Sau migration: có categories nhưng closure rỗng → dựng lại một lần. */
  async onModuleInit(): Promise<void> {
    const [nc, ncc] = await Promise.all([
      this.categoryRepo.count(),
      this.closureRepo.count(),
    ]);
    if (nc > 0 && ncc === 0) {
      await this.dataSource.transaction(async (manager) => {
        await this.rebuildWithManager(manager);
      });
    }
  }

  /**
   * Dựng lại toàn bộ closure từ `categories` (chỉ bản ghi chưa xóa mềm).
   * Gọi sau mỗi thay đổi cây (MVP: full rebuild, đủ cho quy mô master data).
   */
  async rebuildWithManager(manager: EntityManager): Promise<void> {
    const closureRepo = manager.getRepository(CategoryClosure);
    const categoryRepo = manager.getRepository(Category);
    await closureRepo.clear();
    const categories = await categoryRepo.find({
      order: { code: 'ASC' },
    });
    const byId = new Map(categories.map((c) => [c.id, c]));
    const rows: {
      ancestorId: string;
      descendantId: string;
      depth: number;
    }[] = [];
    for (const c of categories) {
      rows.push({ ancestorId: c.id, descendantId: c.id, depth: 0 });
      let ancestorId: string | null = c.parentId;
      let depth = 1;
      while (ancestorId) {
        const parent = byId.get(ancestorId);
        if (!parent) {
          break;
        }
        rows.push({ ancestorId, descendantId: c.id, depth });
        ancestorId = parent.parentId;
        depth++;
      }
    }
    if (rows.length > 0) {
      await closureRepo.insert(rows);
    }
  }

  /** Hậu duệ thực sự (không gồm `ancestorId`), phục vụ kiểm tra chu trình. */
  async getDescendantIds(ancestorId: string): Promise<Set<string>> {
    const rows = await this.closureRepo.find({
      where: { ancestorId, depth: MoreThan(0) },
      select: ['descendantId'],
    });
    return new Set(rows.map((r) => r.descendantId));
  }
}
