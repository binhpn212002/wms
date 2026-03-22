import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListBalancesQueryDto } from './dto/list-balances-query.dto';
import { ListInventoryMovementsQueryDto } from './dto/list-inventory-movements-query.dto';
import { SummaryQueryDto } from './dto/summary-query.dto';
import { InventoryService } from './services/inventory.service';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('balances')
  @ApiOperation({
    summary: 'Danh sách tồn theo kho/vị trí/biến thể (phân trang)',
  })
  listBalances(@Query() query: ListBalancesQueryDto) {
    return this.inventoryService.listBalances(query);
  }

  @Get('summary/by-product')
  @ApiOperation({ summary: 'Tổng tồn nhóm theo sản phẩm / biến thể' })
  summaryByProduct(@Query() query: SummaryQueryDto) {
    return this.inventoryService.summaryByProduct(query);
  }

  @Get('summary/by-warehouse')
  @ApiOperation({ summary: 'Tổng tồn nhóm theo kho / biến thể' })
  summaryByWarehouse(@Query() query: SummaryQueryDto) {
    return this.inventoryService.summaryByWarehouse(query);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Nhật ký thay đổi tồn (ledger)' })
  listMovements(@Query() query: ListInventoryMovementsQueryDto) {
    return this.inventoryService.listMovements(query);
  }
}
