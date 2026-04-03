import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  InventoryCheckLookupQueryDto,
  InventoryCheckVariantQueryDto,
} from './dto/inventory-check-query.dto';
import { InventoryCheckService } from './services/inventory-check.service';

@ApiTags('inventory-check')
@Controller('inventory-check')
export class InventoryCheckController {
  constructor(private readonly inventoryCheckService: InventoryCheckService) {}

  @Get('lookup')
  @ApiOperation({
    summary: 'Tra cứu tồn theo SKU hoặc barcode',
    description:
      'Chế độ summary: tổng tồn + tùy chọn breakdown theo kho. Chế độ details: từng dòng kho/vị trí (quantity > 0).',
  })
  lookup(@Query() query: InventoryCheckLookupQueryDto) {
    return this.inventoryCheckService.lookup(query);
  }

  @Get('variants/:variantId')
  @ApiOperation({ summary: 'Tra cứu tồn theo id biến thể' })
  getByVariant(
    @Param('variantId', new ParseUUIDPipe({ version: '4' })) variantId: string,
    @Query() query: InventoryCheckVariantQueryDto,
  ) {
    return this.inventoryCheckService.getByVariantId(variantId, query);
  }
}
