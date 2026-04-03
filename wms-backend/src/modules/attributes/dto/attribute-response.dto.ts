import { Attribute } from '../../../database/entities/attribute.entity';
import { AttributeValue } from '../../../database/entities/attribute-value.entity';

export class AttributeValueEmbedDto {
  id: string;
  code: string;
  name: string;
  active: boolean;
  deleted_at: Date | null;

  static fromEntity(e: AttributeValue): AttributeValueEmbedDto {
    const d = new AttributeValueEmbedDto();
    d.id = e.id;
    d.code = e.code;
    d.name = e.name;
    d.active = e.active;
    d.deleted_at = e.deletedAt;
    return d;
  }
}

export class AttributeResponseDto {
  id: string;
  code: string;
  name: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  values?: AttributeValueEmbedDto[];

  static fromEntity(e: Attribute): AttributeResponseDto {
    const d = new AttributeResponseDto();
    d.id = e.id;
    d.code = e.code;
    d.name = e.name;
    d.active = e.active;
    d.created_at = e.createdAt;
    d.updated_at = e.updatedAt;
    d.deleted_at = e.deletedAt;
    if (e.values) {
      // Mặc định chỉ trả các giá trị chưa xóa mềm (phù hợp hiển thị bảng).
      d.values = e.values
        .filter((v) => !v.deletedAt)
        .map(AttributeValueEmbedDto.fromEntity);
    }
    return d;
  }
}
