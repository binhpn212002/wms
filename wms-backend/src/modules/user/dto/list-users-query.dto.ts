import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PageOptionDto } from '../../../common/dto/page-option.dto';
import { UserStatus } from '../../../common/constants/user.constant';

export enum UsersSortField {
  USERNAME = 'username',
  PHONE = 'phone',
  CREATED_AT = 'created_at',
}

export class ListUsersQueryDto extends PageOptionDto {
  @ApiPropertyOptional({ enum: UsersSortField })
  @IsOptional()
  @IsEnum(UsersSortField)
  sortBy?: UsersSortField;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  roleId?: string;
}
