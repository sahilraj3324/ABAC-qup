import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { UserService } from './user.service.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async list(@Query('tenant_id') tenantId?: string) {
    if (tenantId) return this.userService.listByTenant(tenantId);
    return this.userService.listAll();
  }

  @Get(':userId')
  async get(@Param('userId') userId: string) {
    return this.userService.get(userId);
  }

  @Post()
  async create(
    @Body() body: { user_data: { email: string; password: string; first_name: string; last_name: string; role_id?: string; role_ids?: string[] } },
    @Query('tenant_id') tenantId: string,
  ) {
    const { email, password, first_name, last_name, role_id, role_ids } = body.user_data;
    return this.userService.createDirect(email, password, first_name, last_name, tenantId, role_id, role_ids);
  }

  @Put(':userId')
  async update(
    @Param('userId') userId: string,
    @Body() body: { first_name?: string; last_name?: string; is_active?: boolean; role_ids?: string[] },
    @Query('tenant_id') tenantId: string,
  ) {
    return this.userService.update(userId, body.first_name, body.last_name, body.is_active, body.role_ids, tenantId);
  }

  @Delete(':userId')
  async delete(@Param('userId') userId: string) {
    return this.userService.delete(userId);
  }

  @Post(':userId/password')
  async updatePassword(
    @Param('userId') userId: string,
    @Body() body: { new_password: string },
  ) {
    return this.userService.updatePassword(userId, body.new_password);
  }
}
