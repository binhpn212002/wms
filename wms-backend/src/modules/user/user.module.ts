import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../database/entities/permission.entity';
import { Role } from '../../database/entities/role.entity';
import { User } from '../../database/entities/user.entity';
import { RolesRepository } from './repositories/roles.repository';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './services/users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Permission])],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    RolesRepository,
    PermissionsGuard,
  ],
  exports: [UsersService, UsersRepository, RolesRepository],
})
export class UserModule {}
