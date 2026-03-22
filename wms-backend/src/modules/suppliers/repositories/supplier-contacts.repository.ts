import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { SupplierContact } from '../../../database/entities/supplier-contact.entity';

@Injectable()
export class SupplierContactsRepository extends BaseRepository<SupplierContact> {
  constructor(
    @InjectRepository(SupplierContact)
    repository: Repository<SupplierContact>,
  ) {
    super(repository);
  }

  findByIdAndSupplierId(
    contactId: string,
    supplierId: string,
    options?: { withDeleted?: boolean },
  ): Promise<SupplierContact | null> {
    return this.repository.findOne({
      where: { id: contactId, supplierId },
      withDeleted: options?.withDeleted === true,
    });
  }

  /**
   * Bỏ cờ primary cho mọi contact còn hiệu lực của supplier (transaction-aware).
   */
  async clearPrimaryForSupplier(
    supplierId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(SupplierContact)
      : this.repository;
    await repo
      .createQueryBuilder()
      .update(SupplierContact)
      .set({ isPrimary: false })
      .where('supplier_id = :supplierId', { supplierId })
      .andWhere('is_primary = :t', { t: true })
      .execute();
  }

  async softDeleteById(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
