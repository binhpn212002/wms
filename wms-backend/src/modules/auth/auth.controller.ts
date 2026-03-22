import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PermissionCode } from '../../common/constants/user.constant';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AuthService } from './services/auth.service';
import { FirebaseLoginDto } from './dto/firebase-login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('firebase')
  @ApiOperation({
    summary:
      'Đăng nhập Firebase — body idToken → JWT. Nếu UID chưa có trong DB: tự gán firebase_id khi SĐT hoặc email trong token khớp user (firebase_id đang null)',
  })
  @HttpCode(HttpStatus.OK)
  loginWithFirebase(@Body() dto: FirebaseLoginDto) {
    return this.authService.loginWithFirebase(dto);
  }

  @Post('register')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionCode.USER_CREATE)
  @ApiOperation({ summary: 'Tạo user (cần quyền user.create)' })
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }
}
