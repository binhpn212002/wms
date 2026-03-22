import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { InventoryMovement } from '../../../database/entities/inventory-movement.entity';
import { ListInventoryMovementsQueryDto } from '../dto/list-inventory-movements-query.dto';

@Injectable()
export class InventoryMovementsRepository extends BaseRepository<InventoryMovement> {
  constructor(
    @InjectRepository(InventoryMovement)
    repository: Repository<InventoryMovement>,
  ) {
    super(repository);
  }

  async findManyWithFilters(
    query: ListInventoryMovementsQueryDto,
  ): Promise<ListResponseDto<InventoryMovement>> {
    query.normalize();
    const qb = this.createQueryBuilder('m').where('1=1');

    if (query.variantId) {
      qb.andWhere('m.variantId = :variantId', { variantId: query.variantId });
    }
    if (query.warehouseId) {
      qb.andWhere('m.warehouseId = :warehouseId', {
        warehouseId: query.warehouseId,
      });
    }
    if (query.referenceType) {
      qb.andWhere('m.referenceType = :referenceType', {
        referenceType: query.referenceType,
      });
    }
    if (query.referenceId) {
      qb.andWhere('m.referenceId = :referenceId', {
        referenceId: query.referenceId,
      });
    }
    if (query.from) {
      qb.andWhere('m.createdAt >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('m.createdAt <= :to', { to: new Date(query.to) });
    }

    qb.orderBy('m.createdAt', 'DESC');
    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return ListResponseDto.create(data, total, query.page, query.limit);
  }
}
