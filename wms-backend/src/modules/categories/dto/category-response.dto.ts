import { Category } from '../../../database/entities/category.entity';

export class CategoryResponseDto {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;

  static fromEntity(e: Category): CategoryResponseDto {
    const d = new CategoryResponseDto();
    d.id = e.id;
    d.code = e.code;
    d.name = e.name;
    d.parent_id = e.parentId;
    d.active = e.active;
    d.created_at = e.createdAt;
    d.updated_at = e.updatedAt;
    d.deleted_at = e.deletedAt;
    return d;
  }
}
