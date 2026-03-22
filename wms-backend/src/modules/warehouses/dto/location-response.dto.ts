import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Location } from '../../../database/entities/location.entity';

export class LocationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  warehouseId: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentId: string | null;

  @ApiProperty()
  type: string;

  @ApiProperty()
  code: string;

  @ApiPropertyOptional({ nullable: true })
  name: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  deletedAt: Date | null;

  @ApiPropertyOptional({ type: () => LocationResponseDto, isArray: true })
  children?: LocationResponseDto[];

  static fromEntity(
    l: Location,
    options?: { children?: LocationResponseDto[] },
  ): LocationResponseDto {
    const d = new LocationResponseDto();
    d.id = l.id;
    d.warehouseId = l.warehouseId;
    d.parentId = l.parentId;
    d.type = l.type;
    d.code = l.code;
    d.name = l.name;
    d.createdAt = l.createdAt;
    d.updatedAt = l.updatedAt;
    d.deletedAt = l.deletedAt;
    if (options?.children !== undefined) {
      d.children = options.children;
    }
    return d;
  }
}
