import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class FirebaseLoginDto {
  @ApiProperty({ description: 'Firebase ID token (client sau khi đăng nhập Firebase)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  idToken: string;
}
