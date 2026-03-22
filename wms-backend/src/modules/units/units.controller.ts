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
import { SortOrder } from 'src/common/dto/page-option.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { GetUnitQueryDto } from './dto/get-unit-query.dto';
import { ListUnitsQueryDto, UnitSortField } from './dto/list-units-query.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitsService } from './services/units.service';

@ApiTags('master-data / units')
@Controller('master-data/units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách đơn vị tính (phân trang + lọc)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, enum: UnitSortField })
  @ApiQuery({ name: 'sort', required: false, enum: SortOrder })
  list(@Query() query: ListUnitsQueryDto) {
    return this.unitsService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết đơn vị tính theo id' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetUnitQueryDto,
  ) {
    return this.unitsService.findOne(id, query.includeDeleted);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUnitDto) {
    return this.unitsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUnitDto) {
    return this.unitsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.unitsService.remove(id);
  }
}
