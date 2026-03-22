import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { SortOrder } from '../../../common/dto/page-option.dto';
import { UserStatus } from '../../../common/constants/user.constant';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { User } from '../../../database/entities/user.entity';
import { ListUsersQueryDto, UsersSortField } from '../dto/list-users-query.dto';

@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
  ) {
    super(repository);
  }

  findByUsername(username: string): Promise<User | null> {
    return this.repository.findOne({
      where: { username },
      relations: ['roles', 'roles.permissions'],
    });
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.repository.findOne({
      where: { phone },
      relations: ['roles', 'roles.permissions'],
    });
  }

  findByUsernameOrPhone(identifier: string): Promise<User | null> {
    return this.repository.findOne({
      where: [{ username: identifier }, { phone: identifier }],
      relations: ['roles', 'roles.permissions'],
    });
  }

  findByFirebaseId(firebaseId: string): Promise<User | null> {
    return this.repository.findOne({
      where: { firebaseId },
      relations: ['roles', 'roles.permissions'],
    });
  }

  /** User chưa gán UID Firebase — dùng khi liên kết lần đầu theo SĐT/email trong token. */
  findAllWithFirebaseIdNullWithRoles(): Promise<User[]> {
    return this.repository.find({
      where: { firebaseId: IsNull() },
      relations: ['roles', 'roles.permissions'],
    });
  }

  findByIdWithRoles(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async existsUsername(username: string, excludeId?: string): Promise<boolean> {
    const qb = this.createQueryBuilder('u').where('u.username = :username', {
      username,
    });
    if (excludeId) {
      qb.andWhere('u.id != :excludeId', { excludeId });
    }
    return qb.getExists();
  }

  async existsPhone(phone: string, excludeId?: string): Promise<boolean> {
    const qb = this.createQueryBuilder('u').where('u.phone = :phone', { phone });
    if (excludeId) {
      qb.andWhere('u.id != :excludeId', { excludeId });
    }
    return qb.getExists();
  }

  async existsFirebaseId(
    firebaseId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const qb = this.createQueryBuilder('u').where('u.firebaseId = :firebaseId', {
      firebaseId,
    });
    if (excludeId) {
      qb.andWhere('u.id != :excludeId', { excludeId });
    }
    return qb.getExists();
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repository.softDelete({ id });
  }

  async findManyWithFilters(
    query: ListUsersQueryDto,
  ): Promise<ListResponseDto<User>> {
    query.normalize();
    const qb = this.createQueryBuilder('u');

    if (query.roleId) {
      qb.innerJoinAndSelect('u.roles', 'r')
        .innerJoinAndSelect('r.permissions', 'p')
        .andWhere('r.id = :roleId', { roleId: query.roleId });
    } else {
      qb.leftJoinAndSelect('u.roles', 'r').leftJoinAndSelect('r.permissions', 'p');
    }

    if (query.status) {
      qb.andWhere('u.status = :status', { status: query.status });
    }
    if (query.q) {
      qb.andWhere(
        '(LOWER(u.username) LIKE LOWER(:q) OR LOWER(u.phone) LIKE LOWER(:q) OR LOWER(u.fullName) LIKE LOWER(:q))',
        { q: `%${query.q}%` },
      );
    }

    const total = await qb.clone().getCount();

    const sortBy = query.sortBy ?? UsersSortField.CREATED_AT;
    const dir = query.sort === SortOrder.DESC ? 'DESC' : 'ASC';
    const col =
      sortBy === UsersSortField.USERNAME
        ? 'u.username'
        : sortBy === UsersSortField.PHONE
          ? 'u.phone'
          : 'u.createdAt';
    qb.orderBy(col, dir);

    qb.skip(query.skip).take(query.limit);
    const data = await qb.getMany();
    return ListResponseDto.create(data, total, query.page, query.limit);
  }
}
