import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { RoleService } from './role.service.js';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  async list(@Query('tenant_id') tenantId?: string) {
    if (tenantId) return this.roleService.listByTenant(tenantId);
    return this.roleService.listAll();
  }

  // IMPORTANT: static segment 'user' must be before the :roleId wildcard
  @Get('user/:userId')
  async getRolesForUser(
    @Param('userId') userId: string,
    @Query('tenant_id') tenantId: string,
  ) {
    return this.roleService.getRolesForUser(userId, tenantId);
  }

  @Get(':roleId')
  async get(@Param('roleId') roleId: string) {
    return this.roleService.get(roleId);
  }

  @Post()
  async create(
    @Body() body: { role_data: { name: string; description?: string } },
    @Query('tenant_id') tenantId: string,
  ) {
    const { name, description } = body.role_data;
    return this.roleService.ensure(tenantId, name, description);
  }

  @Put(':roleId')
  async update(
    @Param('roleId') roleId: string,
    @Body() body: { role_data: { name?: string; description?: string } },
  ) {
    const { name, description } = body.role_data;
    await this.roleService.update(roleId, name, description);
    return this.roleService.get(roleId);
  }

  @Delete(':roleId')
  async delete(@Param('roleId') roleId: string) {
    return this.roleService.delete(roleId);
  }
}

@Controller('user-roles')
export class UserRoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post('assign')
  async assign(@Body() body: { user_id: string; role_id: string; tenant_id: string }) {
    await this.roleService.assignUserRole(body.user_id, body.role_id, body.tenant_id);
    return { message: 'Role assigned successfully' };
  }

  @Delete('remove')
  async remove(@Body() body: { user_id: string; role_id: string; tenant_id: string }) {
    await this.roleService.removeUserRole(body.user_id, body.role_id, body.tenant_id);
    return { message: 'Role removed successfully' };
  }
}
