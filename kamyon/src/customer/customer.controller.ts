import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { CustomersService } from './customer.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  /**
   * 🟢 GİRİŞ / KAYIT ENDPOINTİ
   * POST /customers
   * Body: { phoneNumber: "+90555...", firstName: "Ahmet", ... }
   */
  @Post()
  @HttpCode(HttpStatus.OK) // 200 OK döner (yeni oluşsa da var olsa da)
  async createOrLogin(@Body() createCustomerDto: any) {
    return this.customersService.createOrLogin(createCustomerDto);
  }

  /**
   * 🟢 PROFİL BİLGİSİ ÇEKME
   * GET /customers/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  /**
   * 🟢 PROFİL GÜNCELLEME
   * PATCH /customers/:id
   * Body: { email: "yeni@mail.com", city: "İstanbul" }
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.customersService.update(id, updateData);
  }

  /**
   * 🔴 HESAP SİLME
   * DELETE /customers/:id
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
  
  /**
   * 🔐 (Opsiyonel) TÜM LİSTE
   * Sadece admin kullanmalı, şimdilik açık bırakıyorum test için.
   */
  @Get()
  async findAll() {
    return this.customersService.findAll();
  }
}