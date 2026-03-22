import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierContact } from '../../database/entities/supplier-contact.entity';
import { Supplier } from '../../database/entities/supplier.entity';
import { SupplierContactsRepository } from './repositories/supplier-contacts.repository';
import { SuppliersRepository } from './repositories/suppliers.repository';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './services/suppliers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier, SupplierContact])],
  controllers: [SuppliersController],
  providers: [SuppliersService, SuppliersRepository, SupplierContactsRepository],
  exports: [SuppliersService, SuppliersRepository, SupplierContactsRepository],
})
export class SuppliersModule {}
