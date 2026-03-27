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
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ListTransfersQueryDto } from './dto/list-transfers-query.dto';
import { ReplaceTransferLinesDto } from './dto/replace-transfer-lines.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { TransfersService } from './services/transfers.service';

@ApiTags('transfers')
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo phiếu chuyển kho (draft)' })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTransferDto) {
    return this.transfersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách phiếu chuyển kho' })
  list(@Query() query: ListTransfersQueryDto) {
    return this.transfersService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết phiếu chuyển kho kèm dòng' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transfersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Sửa header khi chưa hoàn tất' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTransferDto) {
    return this.transfersService.update(id, dto);
  }

  @Put(':id/lines')
  @ApiOperation({ summary: 'Thay thế toàn bộ dòng (chỉ draft)' })
  replaceLines(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReplaceTransferLinesDto,
  ) {
    return this.transfersService.replaceLines(id, dto);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Dry-run kiểm tồn — không ghi sổ' })
  validate(@Param('id', ParseUUIDPipe) id: string) {
    return this.transfersService.validate(id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Hoàn tất phiếu — trừ nguồn + cộng đích + ledger' })
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.transfersService.complete(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa mềm phiếu (chỉ draft)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.transfersService.remove(id);
  }
}

