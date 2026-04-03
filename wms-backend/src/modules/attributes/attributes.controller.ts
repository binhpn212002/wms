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
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { GetAttributeQueryDto } from './dto/get-attribute-query.dto';
import { ListAttributesQueryDto } from './dto/list-attributes-query.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';
import { AttributesService } from './services/attributes.service';
import { SortOrder } from 'src/common/dto/page-option.dto';

@ApiTags('master-data / attributes')
@Controller('master-data/attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách thuộc tính (phân trang + lọc)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiQuery({ name: 'includeValues', required: false, type: Boolean })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: SortOrder,
  })
  list(@Query() query: ListAttributesQueryDto) {
    return this.attributesService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết thuộc tính theo id' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiQuery({ name: 'includeValues', required: false, type: Boolean })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetAttributeQueryDto,
  ) {
    return this.attributesService.findOne(
      id,
      query.includeDeleted,
      query.includeValues,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAttributeDto) {
    return this.attributesService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttributeDto,
  ) {
    return this.attributesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.attributesService.remove(id);
  }
}
