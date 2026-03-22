import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SortOrder } from '../../common/dto/page-option.dto';
import { CreateSupplierContactDto } from './dto/create-supplier-contact.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { GetSupplierQueryDto } from './dto/get-supplier-query.dto';
import {
  ListSuppliersQueryDto,
  SupplierSortField,
} from './dto/list-suppliers-query.dto';
import { UpdateSupplierContactDto } from './dto/update-supplier-contact.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './services/suppliers.service';

@ApiTags('suppliers')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách nhà cung cấp (phân trang)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiQuery({ name: 'includeContacts', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, enum: SupplierSortField })
  @ApiQuery({ name: 'sort', required: false, enum: SortOrder })
  list(@Query() query: ListSuppliersQueryDto) {
    return this.suppliersService.list(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo nhà cung cấp (có thể kèm danh sách liên hệ)',
  })
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết nhà cung cấp (kèm liên hệ)' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetSupplierQueryDto,
  ) {
    return this.suppliersService.findOne(id, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật nhà cung cấp' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa mềm nhà cung cấp' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.suppliersService.remove(id);
  }

  @Post(':id/contacts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Thêm liên hệ cho nhà cung cấp' })
  createContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSupplierContactDto,
  ) {
    return this.suppliersService.createContact(id, dto);
  }

  @Patch(':id/contacts/:contactId')
  @ApiOperation({ summary: 'Cập nhật liên hệ' })
  updateContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Body() dto: UpdateSupplierContactDto,
  ) {
    return this.suppliersService.updateContact(id, contactId, dto);
  }

  @Delete(':id/contacts/:contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa mềm liên hệ' })
  async removeContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
  ) {
    await this.suppliersService.removeContact(id, contactId);
  }
}
