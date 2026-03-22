import { Attribute } from '../../../database/entities/attribute.entity';

export class AttributeResponseDto {
  id: string;
  code: string;
  name: string;
  sort_order: number | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;

  static fromEntity(e: Attribute): AttributeResponseDto {
    const d = new AttributeResponseDto();
    d.id = e.id;
    d.code = e.code;
    d.name = e.name;
    d.sort_order = e.sortOrder;
    d.active = e.active;
    d.created_at = e.createdAt;
    d.updated_at = e.updatedAt;
    d.deleted_at = e.deletedAt;
    return d;
  }
}
