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
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { GetWarehouseQueryDto } from './dto/get-warehouse-query.dto';
import {
  ListLocationsQueryDto,
  LocationsView,
} from './dto/list-locations-query.dto';
import {
  ListWarehousesQueryDto,
  WarehouseSortField,
} from './dto/list-warehouses-query.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehousesService } from './services/warehouses.service';

@ApiTags('warehouses')
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách kho (phân trang)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, enum: WarehouseSortField })
  @ApiQuery({ name: 'sort', required: false, enum: SortOrder })
  list(@Query() query: ListWarehousesQueryDto) {
    return this.warehousesService.list(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo kho' })
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehousesService.create(dto);
  }

  @Get(':warehouseId/locations')
  @ApiOperation({
    summary: 'Danh sách vị trí trong kho (flat phân trang hoặc tree)',
  })
  @ApiQuery({ name: 'view', required: false, enum: LocationsView })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: ['zone', 'rack', 'bin'] })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  listLocations(
    @Param('warehouseId', ParseUUIDPipe) warehouseId: string,
    @Query() query: ListLocationsQueryDto,
  ) {
    return this.warehousesService.listLocations(warehouseId, query);
  }

  @Post(':warehouseId/locations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo vị trí trong kho' })
  createLocation(
    @Param('warehouseId', ParseUUIDPipe) warehouseId: string,
    @Body() dto: CreateLocationDto,
  ) {
    return this.warehousesService.createLocation(warehouseId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết kho' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetWarehouseQueryDto,
  ) {
    return this.warehousesService.findOne(id, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật kho' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    return this.warehousesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa mềm kho' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.warehousesService.remove(id);
  }
}
