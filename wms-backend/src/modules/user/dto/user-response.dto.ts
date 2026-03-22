import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../../common/constants/user.constant';
import { User } from '../../../database/entities/user.entity';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  email: string | null;

  @ApiPropertyOptional()
  fullName: string | null;

  @ApiPropertyOptional()
  avatarUrl: string | null;

  @ApiPropertyOptional()
  dob: string | null;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty({ type: [String], description: 'Mã role (code)' })
  roles: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.username = user.username;
    dto.phone = user.phone;
    dto.email = user.email;
    dto.fullName = user.fullName;
    dto.avatarUrl = user.avatarUrl;
    dto.dob = user.dob;
    dto.status = user.status as UserStatus;
    dto.roles = user.roles?.map((r) => r.code) ?? [];
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
