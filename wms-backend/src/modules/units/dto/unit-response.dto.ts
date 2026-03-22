import { Unit } from '../../../database/entities/unit.entity';

export class UnitResponseDto {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;

  static fromEntity(e: Unit): UnitResponseDto {
    const d = new UnitResponseDto();
    d.id = e.id;
    d.code = e.code;
    d.name = e.name;
    d.symbol = e.symbol;
    d.active = e.active;
    d.created_at = e.createdAt;
    d.updated_at = e.updatedAt;
    d.deleted_at = e.deletedAt;
    return d;
  }
}
