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
import { CreateInboundDto } from './dto/create-inbound.dto';
import { ListInboundQueryDto } from './dto/list-inbound-query.dto';
import { ReplaceInboundLinesDto } from './dto/replace-inbound-lines.dto';
import { UpdateInboundDto } from './dto/update-inbound.dto';
import { InboundService } from './services/inbound.service';

@ApiTags('inbound')
@Controller('inbound')
export class InboundController {
  constructor(private readonly inboundService: InboundService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo phiếu nhập (draft)' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateInboundDto) {
    return this.inboundService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách phiếu nhập' })
  list(@Query() query: ListInboundQueryDto) {
    return this.inboundService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết phiếu nhập kèm dòng' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inboundService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Sửa header khi chưa hoàn tất' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInboundDto,
  ) {
    return this.inboundService.update(id, dto);
  }

  @Put(':id/lines')
  @ApiOperation({ summary: 'Thay thế toàn bộ dòng (chỉ draft)' })
  replaceLines(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplaceInboundLinesDto,
  ) {
    return this.inboundService.replaceLines(id, dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Xác nhận phiếu (draft → confirmed)' })
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.inboundService.confirm(id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Hoàn tất phiếu — cộng tồn + ledger' })
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.inboundService.complete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm phiếu (chỉ draft)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.inboundService.remove(id);
  }
}
