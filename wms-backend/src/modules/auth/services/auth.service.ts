import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { CreateUserDto } from '../../user/dto/create-user.dto';
import { UserResponseDto } from '../../user/dto/user-response.dto';
import { UsersService } from '../../user/services/users.service';
import { FirebaseLoginDto } from '../dto/firebase-login.dto';
import { LoginDto } from '../dto/login.dto';
import { FirebaseAdminService } from './firebase-admin.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly firebaseAdmin: FirebaseAdminService,
  ) {}



  /** Username + password: BE gọi Firebase Identity Toolkit (Email/Password) → idToken → JWT. */
  async login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const email = await this.usersService.resolveEmailForPasswordLogin(
      dto.username,
    );
    const data = await this.firebaseAdmin.signInWithEmailAndPassword(
      email,
      dto.password,
    );
   
  
    return { accessToken: data.idToken ?? ''  , refreshToken: data.refreshToken ?? '' };
  }

  async register(dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }
}
