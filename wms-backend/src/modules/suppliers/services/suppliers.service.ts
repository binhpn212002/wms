import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ListResponseDto } from '../../../common/dto/list-response.dto';
import {
  SupplierCodeDuplicateException,
  SupplierContactNotFoundException,
  SupplierInUseException,
  SupplierNotFoundException,
  SupplierTaxIdDuplicateException,
} from '../../../common/exceptions/supplier.exceptions';
import { SupplierContact } from '../../../database/entities/supplier-contact.entity';
import { Supplier } from '../../../database/entities/supplier.entity';
import { CreateSupplierContactDto } from '../dto/create-supplier-contact.dto';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { GetSupplierQueryDto } from '../dto/get-supplier-query.dto';
import { ListSuppliersQueryDto } from '../dto/list-suppliers-query.dto';
import { SupplierContactResponseDto } from '../dto/supplier-contact-response.dto';
import { SupplierResponseDto } from '../dto/supplier-response.dto';
import { UpdateSupplierContactDto } from '../dto/update-supplier-contact.dto';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';
import { SupplierContactsRepository } from '../repositories/supplier-contacts.repository';
import { SuppliersRepository } from '../repositories/suppliers.repository';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly suppliersRepo: SuppliersRepository,
    private readonly supplierContactsRepo: SupplierContactsRepository,
    private readonly dataSource: DataSource,
  ) {}

  private async countInboundRefsBySupplierId(
    supplierId: string,
  ): Promise<number> {
    const rows = (await this.dataSource.query(
      `SELECT COUNT(*)::int AS c FROM inbound_documents WHERE supplier_id = $1 AND deleted_at IS NULL`,
      [supplierId],
    )) as { c: number }[];
    return rows[0]?.c ?? 0;
  }

  private assertAtMostOnePrimary(
    contacts: CreateSupplierContactDto[] | undefined,
  ): void {
    if (!contacts?.length) {
      return;
    }
    const n = contacts.filter((c) => c.isPrimary === true).length;
    if (n > 1) {
      throw new UnprocessableEntityException({
        message: 'Chỉ được đánh dấu tối đa một liên hệ chính',
      });
    }
  }

  private normalizeTaxId(value: string | null | undefined): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const t = String(value).trim();
    return t === '' ? null : t;
  }

  async list(
    query: ListSuppliersQueryDto,
  ): Promise<ListResponseDto<SupplierResponseDto>> {
    const res = await this.suppliersRepo.findManyWithFilters(query);
    const data = res.data.map((s) => {
      const contacts = s.contacts
        ? s.contacts.map((c) => SupplierContactResponseDto.fromEntity(c))
        : undefined;
      return SupplierResponseDto.fromEntity(s, { contacts });
    });
    return ListResponseDto.create(data, res.total, res.page, res.limit);
  }

  async findOne(
    id: string,
    query: GetSupplierQueryDto,
  ): Promise<SupplierResponseDto> {
    const withDeleted = query.includeDeleted === true;
    const s = await this.suppliersRepo.findByIdWithContacts(id, {
      withDeleted,
    });
    if (!s || (!withDeleted && s.deletedAt)) {
      throw new SupplierNotFoundException();
    }
    const contacts = (s.contacts ?? []).map((c) =>
      SupplierContactResponseDto.fromEntity(c),
    );
    return SupplierResponseDto.fromEntity(s, { contacts });
  }

  async create(dto: CreateSupplierDto): Promise<SupplierResponseDto> {
    this.assertAtMostOnePrimary(dto.contacts);
    const code = dto.code.trim().toUpperCase();
    if (await this.suppliersRepo.existsActiveByCode(code)) {
      throw new SupplierCodeDuplicateException();
    }
    const taxId = this.normalizeTaxId(dto.taxId ?? null);
    if (taxId && (await this.suppliersRepo.existsActiveByTaxId(taxId))) {
      throw new SupplierTaxIdDuplicateException();
    }

    let newId = '';
    await this.dataSource.transaction(async (manager) => {
      const supplierRepo = manager.getRepository(Supplier);
      const contactRepo = manager.getRepository(SupplierContact);

      const entity = supplierRepo.create({
        code,
        name: dto.name.trim(),
        taxId,
        notes: dto.notes?.trim() ?? null,
        active: dto.active ?? true,
      });
      await supplierRepo.save(entity);
      newId = entity.id;

      if (dto.contacts?.length) {
        for (const c of dto.contacts) {
          if (c.isPrimary) {
            await this.supplierContactsRepo.clearPrimaryForSupplier(
              entity.id,
              manager,
            );
          }
          const row = contactRepo.create({
            supplierId: entity.id,
            name: c.name.trim(),
            phone: c.phone ?? null,
            email: c.email ?? null,
            title: c.title ?? null,
            isPrimary: Boolean(c.isPrimary),
          });
          await contactRepo.save(row);
        }
      }
    });

    return this.findOne(newId, {});
  }

  async update(
    id: string,
    dto: UpdateSupplierDto,
  ): Promise<SupplierResponseDto> {
    const s = await this.suppliersRepo.findById(id);
    if (!s || s.deletedAt) {
      throw new SupplierNotFoundException();
    }
    if (dto.code !== undefined) {
      const code = dto.code.trim().toUpperCase();
      if (await this.suppliersRepo.existsActiveByCode(code, id)) {
        throw new SupplierCodeDuplicateException();
      }
      s.code = code;
    }
    if (dto.name !== undefined) {
      s.name = dto.name.trim();
    }
    if (dto.taxId !== undefined) {
      const taxId = this.normalizeTaxId(dto.taxId);
      if (taxId && (await this.suppliersRepo.existsActiveByTaxId(taxId, id))) {
        throw new SupplierTaxIdDuplicateException();
      }
      s.taxId = taxId;
    }
    if (dto.notes !== undefined) {
      s.notes = dto.notes?.trim() ?? null;
    }
    if (dto.active !== undefined) {
      s.active = dto.active;
    }
    await this.suppliersRepo.save(s);
    return this.findOne(id, {});
  }

  async remove(id: string): Promise<void> {
    const s = await this.suppliersRepo.findById(id);
    if (!s || s.deletedAt) {
      throw new SupplierNotFoundException();
    }
    const n = await this.countInboundRefsBySupplierId(id);
    if (n > 0) {
      throw new SupplierInUseException();
    }
    await this.suppliersRepo.softDeleteById(id);
  }

  async createContact(
    supplierId: string,
    dto: CreateSupplierContactDto,
  ): Promise<SupplierContactResponseDto> {
    const supplier = await this.suppliersRepo.findById(supplierId);
    if (!supplier || supplier.deletedAt) {
      throw new SupplierNotFoundException();
    }

    let created: SupplierContact;
    await this.dataSource.transaction(async (manager) => {
      const contactRepo = manager.getRepository(SupplierContact);
      if (dto.isPrimary) {
        await this.supplierContactsRepo.clearPrimaryForSupplier(
          supplierId,
          manager,
        );
      }
      const row = contactRepo.create({
        supplierId,
        name: dto.name.trim(),
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        title: dto.title ?? null,
        isPrimary: Boolean(dto.isPrimary),
      });
      created = await contactRepo.save(row);
    });

    return SupplierContactResponseDto.fromEntity(created!);
  }

  async updateContact(
    supplierId: string,
    contactId: string,
    dto: UpdateSupplierContactDto,
  ): Promise<SupplierContactResponseDto> {
    const row = await this.supplierContactsRepo.findByIdAndSupplierId(
      contactId,
      supplierId,
    );
    if (!row || row.deletedAt) {
      throw new SupplierContactNotFoundException();
    }

    await this.dataSource.transaction(async (manager) => {
      const contactRepo = manager.getRepository(SupplierContact);
      if (dto.isPrimary === true) {
        await this.supplierContactsRepo.clearPrimaryForSupplier(
          supplierId,
          manager,
        );
      }
      if (dto.name !== undefined) {
        row.name = dto.name.trim();
      }
      if (dto.phone !== undefined) {
        row.phone = dto.phone;
      }
      if (dto.email !== undefined) {
        row.email = dto.email;
      }
      if (dto.title !== undefined) {
        row.title = dto.title;
      }
      if (dto.isPrimary !== undefined) {
        row.isPrimary = dto.isPrimary;
      }
      await contactRepo.save(row);
    });

    const fresh = await this.supplierContactsRepo.findByIdAndSupplierId(
      contactId,
      supplierId,
    );
    return SupplierContactResponseDto.fromEntity(fresh!);
  }

  async removeContact(supplierId: string, contactId: string): Promise<void> {
    const row = await this.supplierContactsRepo.findByIdAndSupplierId(
      contactId,
      supplierId,
    );
    if (!row || row.deletedAt) {
      throw new SupplierContactNotFoundException();
    }
    await this.supplierContactsRepo.softDeleteById(contactId);
  }
}
