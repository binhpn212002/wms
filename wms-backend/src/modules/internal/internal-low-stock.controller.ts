import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InternalApiKeyGuard } from './guards/internal-api-key.guard';
import { LowStockAlertService } from './services/low-stock-alert.service';

@ApiExcludeController()
@Controller('internal/low-stock')
@UseGuards(InternalApiKeyGuard)
export class InternalLowStockController {
  constructor(private readonly lowStockAlertService: LowStockAlertService) {}

  @Post('scan')
  @HttpCode(200)
  scan() {
    return this.lowStockAlertService.scanAndEnqueue();
  }
}
