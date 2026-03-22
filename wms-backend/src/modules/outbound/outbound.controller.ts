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
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateOutboundDto } from './dto/create-outbound.dto';
import { ListOutboundQueryDto } from './dto/list-outbound-query.dto';
import { ReplaceOutboundLinesDto } from './dto/replace-outbound-lines.dto';
import { UpdateOutboundDto } from './dto/update-outbound.dto';
import { OutboundService } from './services/outbound.service';

@ApiTags('outbound')
@Controller('outbound')
export class OutboundController {
  constructor(private readonly outboundService: OutboundService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo phiếu xuất (draft)' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateOutboundDto) {
    return this.outboundService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách phiếu xuất' })
  list(@Query() query: ListOutboundQueryDto) {
    return this.outboundService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết phiếu xuất kèm dòng' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.outboundService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Sửa header khi chưa hoàn tất' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOutboundDto,
  ) {
    return this.outboundService.update(id, dto);
  }

  @Put(':id/lines')
  @ApiOperation({ summary: 'Thay thế toàn bộ dòng (chỉ draft)' })
  replaceLines(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplaceOutboundLinesDto,
  ) {
    return this.outboundService.replaceLines(id, dto);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Dry-run kiểm tồn — không ghi sổ' })
  validate(@Param('id', ParseUUIDPipe) id: string) {
    return this.outboundService.validate(id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Xác nhận phiếu (draft → confirmed)' })
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.outboundService.confirm(id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Hoàn tất phiếu — trừ tồn + ledger' })
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.outboundService.complete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm phiếu (chỉ draft)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.outboundService.remove(id);
  }
}
