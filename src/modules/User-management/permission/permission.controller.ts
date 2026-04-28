import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { PermissionService } from './permission.service.js';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  async list() {
    return this.permissionService.listAll();
  }

  // Static segments MUST come before :permissionId wildcard

  @Get('code/:code')
  async getByCode(@Param('code') code: string) {
    return this.permissionService.getByCode(code);
  }

  @Get('user/:userId/environment/:envId/effective')
  async effectiveCodes(
    @Param('userId') userId: string,
    @Param('envId') envId: string, // envId used as tenantId
  ) {
    return this.permissionService.effectiveCodes(userId, envId);
  }

  @Get(':permissionId')
  async get(@Param('permissionId') permissionId: string) {
    return this.permissionService.get(permissionId);
  }

  @Post()
  async create(
    @Body() body: { permission_data: { code: string; name: string; description?: string } },
  ) {
    const { code, name, description } = body.permission_data;
    return this.permissionService.ensure(code, name, description);
  }

  @Post('grant-to-role')
  async grantToRole(@Body() body: { role_id: string; permission_code: string }) {
    const perm = await this.permissionService.getByCode(body.permission_code);
    await this.permissionService.grantToRole(body.role_id, perm.id);
    return { message: 'Permission granted to role successfully' };
  }

  // DELETE grant-to-role MUST come before :permissionId wildcard
  @Delete('grant-to-role/:roleId/:permissionCode')
  async revokeFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionCode') permissionCode: string,
  ) {
    const perm = await this.permissionService.getByCode(permissionCode);
    await this.permissionService.revokeFromRole(roleId, perm.id);
    return { message: 'Permission revoked from role successfully' };
  }

  @Put(':permissionId')
  async update(
    @Param('permissionId') permissionId: string,
    @Body() body: { permission_data: { code?: string; name?: string; description?: string } },
  ) {
    const { code, name, description } = body.permission_data;
    await this.permissionService.update(permissionId, code, name, description);
    return this.permissionService.get(permissionId);
  }

  @Delete(':permissionId')
  async delete(@Param('permissionId') permissionId: string) {
    return this.permissionService.delete(permissionId);
  }
}
