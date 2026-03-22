import { SupplierContact } from '../../../database/entities/supplier-contact.entity';

export class SupplierContactResponseDto {
  id: string;
  supplier_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  title: string | null;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;

  static fromEntity(c: SupplierContact): SupplierContactResponseDto {
    const d = new SupplierContactResponseDto();
    d.id = c.id;
    d.supplier_id = c.supplierId;
    d.name = c.name;
    d.phone = c.phone;
    d.email = c.email;
    d.title = c.title;
    d.is_primary = c.isPrimary;
    d.created_at = c.createdAt;
    d.updated_at = c.updatedAt;
    d.deleted_at = c.deletedAt;
    return d;
  }
}
