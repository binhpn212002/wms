import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { UserStatus } from '../../../common/constants/user.constant';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(255)
  email?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string | null;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description:
      'UID Firebase — gán/sửa thủ công (admin). Null để xóa liên kết (hiếm khi dùng)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string' && value.trim() === '') return null;
    return typeof value === 'string' ? value.trim() : value;
  })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(128)
  firebaseId?: string | null;
}
