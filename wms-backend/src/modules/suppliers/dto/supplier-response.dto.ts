import { Supplier } from '../../../database/entities/supplier.entity';
import { SupplierContactResponseDto } from './supplier-contact-response.dto';

export class SupplierResponseDto {
  id: string;
  code: string;
  name: string;
  tax_id: string | null;
  notes: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  contact_count?: number;
  contacts?: SupplierContactResponseDto[];

  static fromEntity(
    s: Supplier,
    options?: { contacts?: SupplierContactResponseDto[] },
  ): SupplierResponseDto {
    const d = new SupplierResponseDto();
    d.id = s.id;
    d.code = s.code;
    d.name = s.name;
    d.tax_id = s.taxId;
    d.notes = s.notes;
    d.active = s.active;
    d.created_at = s.createdAt;
    d.updated_at = s.updatedAt;
    d.deleted_at = s.deletedAt;
    if (typeof s.contactCount === 'number') {
      d.contact_count = s.contactCount;
    }
    if (options?.contacts !== undefined) {
      d.contacts = options.contacts;
    }
    return d;
  }
}
