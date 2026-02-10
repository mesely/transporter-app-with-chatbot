import { Controller, Get, Post, Body, Query, Param, Patch, Delete } from '@nestjs/common';
import { TariffsService } from './tariffs.service';
import { CreateTariffDto } from './dto/create-tariff.dto';

@Controller('tariffs')
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  // POST /tariffs -> Yeni tarife ekle veya güncelle
  @Post()
  create(@Body() createTariffDto: CreateTariffDto) {
    return this.tariffsService.create(createTariffDto);
  }

  // GET /tariffs -> Hepsini getir
  // GET /tariffs?type=nakliye -> Sadece nakliyeyi getir
  @Get()
  getTariff(@Query('type') type?: string) {
    if (type) {
      return this.tariffsService.findByType(type);
    }
    return this.tariffsService.findAll();
  }

  // GET /tariffs/:id -> ID ile tekil getir
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tariffsService.findOne(id);
  }

  // PATCH /tariffs/:id -> Güncelle
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.tariffsService.update(id, body);
  }

  // DELETE /tariffs/:id -> Sil
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.tariffsService.delete(id);
  }
}