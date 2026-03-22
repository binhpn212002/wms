import { AttributeValue } from '../../../database/entities/attribute-value.entity';

export class AttributeValueResponseDto {
  id: string;
  attribute_id: string;
  code: string;
  name: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;

  static fromEntity(e: AttributeValue): AttributeValueResponseDto {
    const d = new AttributeValueResponseDto();
    d.id = e.id;
    d.attribute_id = e.attributeId;
    d.code = e.code;
    d.name = e.name;
    d.active = e.active;
    d.created_at = e.createdAt;
    d.updated_at = e.updatedAt;
    d.deleted_at = e.deletedAt;
    return d;
  }
}
