import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignUserRolesDto {
  @ApiProperty({ type: [String], description: 'Thay thế toàn bộ vai trò' })
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds: string[];
}
