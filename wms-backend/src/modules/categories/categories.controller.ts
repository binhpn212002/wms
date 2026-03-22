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
import { CreateCategoryDto } from './dto/create-category.dto';
import { GetCategoryQueryDto } from './dto/get-category-query.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { TreeCategoriesQueryDto } from './dto/tree-categories-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesService } from './services/categories.service';

@ApiTags('master-data / categories')
@Controller('master-data/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách danh mục (phân trang + lọc)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'parent_id', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['code', 'name', 'created_at'],
  })
  list(@Query() query: ListCategoriesQueryDto) {
    return this.categoriesService.list(query);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Cây danh mục (nested children)' })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  tree(@Query() query: TreeCategoriesQueryDto) {
    return this.categoriesService.tree(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết danh mục theo id' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetCategoryQueryDto,
  ) {
    return this.categoriesService.findOne(id, query.includeDeleted);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.categoriesService.remove(id);
  }
}
