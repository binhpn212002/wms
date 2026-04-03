import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListProductVariantsQueryDto } from './dto/list-product-variants-query.dto';
import { ProductsService } from './services/products.service';

@ApiTags('product-variants')
@Controller('product-variants')
export class ProductVariantsLookupController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Tra cứu biến thể (SKU / mã vạch) kèm thông tin sản phẩm tối giản',
  })
  lookup(@Query() query: ListProductVariantsQueryDto) {
    return this.productsService.lookupVariants(query);
  }
}
