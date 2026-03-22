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
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { GetAttributeValueQueryDto } from './dto/get-attribute-value-query.dto';
import { ListAttributeValuesQueryDto } from './dto/list-attribute-values-query.dto';
import { UpdateAttributeValueDto } from './dto/update-attribute-value.dto';
import { AttributeValuesService } from './services/attribute-values.service';

@ApiTags('master-data / attribute-values')
@Controller('master-data/attributes/:attributeId/values')
export class AttributeValuesController {
  constructor(
    private readonly attributeValuesService: AttributeValuesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Danh sách giá trị theo thuộc tính (phân trang + lọc)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['code', 'name', 'created_at'],
  })
  list(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @Query() query: ListAttributeValuesQueryDto,
  ) {
    return this.attributeValuesService.list(attributeId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết một giá trị thuộc tính' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  findOne(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetAttributeValueQueryDto,
  ) {
    return this.attributeValuesService.findOne(
      attributeId,
      id,
      query.includeDeleted,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @Body() dto: CreateAttributeValueDto,
  ) {
    return this.attributeValuesService.create(attributeId, dto);
  }

  @Patch(':id')
  update(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttributeValueDto,
  ) {
    return this.attributeValuesService.update(attributeId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.attributeValuesService.remove(attributeId, id);
  }
}
