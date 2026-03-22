import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Đăng nhập qua BE: Firebase Auth (Email/Password).
 * - `username` có thể là **email** (dùng trực tiếp với Firebase), hoặc **username** trong DB
 *   (khi đó cần có `users.email` khớp tài khoản Firebase Email/Password).
 */
export class LoginDto {
  @ApiProperty({
    description:
      'Tên đăng nhập trong WMS hoặc email đăng nhập Firebase (nếu là email)',
    example: 'admin@example.com',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  username: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(256)
  password: string;
}
