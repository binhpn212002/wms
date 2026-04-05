import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockBalance } from '../../database/entities/stock-balance.entity';
import { User } from '../../database/entities/user.entity';
import { InternalApiKeyGuard } from './guards/internal-api-key.guard';
import { InternalLowStockController } from './internal-low-stock.controller';
import { LowStockAlertService } from './services/low-stock-alert.service';

@Module({
  imports: [TypeOrmModule.forFeature([StockBalance, User])],
  controllers: [InternalLowStockController],
  providers: [LowStockAlertService, InternalApiKeyGuard],
})
export class InternalModule {}
