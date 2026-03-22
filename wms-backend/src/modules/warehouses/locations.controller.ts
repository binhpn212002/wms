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
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetLocationQueryDto } from './dto/get-location-query.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationsService } from './services/locations.service';

@ApiTags('locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết vị trí' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetLocationQueryDto,
  ) {
    return this.locationsService.findOne(id, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật vị trí' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa mềm vị trí' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.locationsService.remove(id);
  }
}
