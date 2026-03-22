import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Warehouse } from '../../../database/entities/warehouse.entity';

export class WarehouseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  address: string | null;

  @ApiProperty()
  active: boolean;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  defaultLocationId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  deletedAt: Date | null;

  static fromEntity(w: Warehouse): WarehouseResponseDto {
    const d = new WarehouseResponseDto();
    d.id = w.id;
    d.code = w.code;
    d.name = w.name;
    d.address = w.address;
    d.active = w.active;
    d.defaultLocationId = w.defaultLocationId;
    d.createdAt = w.createdAt;
    d.updatedAt = w.updatedAt;
    d.deletedAt = w.deletedAt;
    return d;
  }
}
