import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Role } from '../../../database/entities/role.entity';

@Injectable()
export class RolesRepository extends BaseRepository<Role> {
  constructor(
    @InjectRepository(Role)
    repository: Repository<Role>,
  ) {
    super(repository);
  }

  findByCode(code: string): Promise<Role | null> {
    return this.repository.findOne({ where: { code } });
  }

  findByIds(ids: string[]): Promise<Role[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.repository.findBy({ id: In(ids) });
  }

  findAll(): Promise<Role[]> {
    return this.repository.find({ order: { code: 'ASC' } });
  }
}
