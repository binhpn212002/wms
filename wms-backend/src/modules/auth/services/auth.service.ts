import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { CreateUserDto } from '../../user/dto/create-user.dto';
import { UserResponseDto } from '../../user/dto/user-response.dto';
import { UsersService } from '../../user/services/users.service';
import { FirebaseLoginDto } from '../dto/firebase-login.dto';
import { FirebaseAdminService } from './firebase-admin.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly firebaseAdmin: FirebaseAdminService,
  ) {}

  async loginWithFirebase(dto: FirebaseLoginDto): Promise<{
    accessToken: string;
    user: AuthUser;
  }> {
    const decoded = await this.firebaseAdmin.verifyIdToken(dto.idToken);
    const user = await this.usersService.resolveUserForFirebaseLogin(
      decoded.uid,
      decoded,
    );
    const authUser = this.usersService.toAuthUser(user);
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
    });
    return { accessToken, user: authUser };
  }

  async register(dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }
}
