import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { GroupService } from './group.service.js';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  async list(@Query('tenant_id') tenantId?: string) {
    if (tenantId) return this.groupService.listByTenant(tenantId);
    return { groups: [], total: 0 };
  }

  // Static 'user' segment before :groupId wildcard
  @Get('user/:userId')
  async groupsForUser(
    @Param('userId') userId: string,
    @Query('tenant_id') tenantId: string,
  ) {
    return this.groupService.groupsForUser(userId, tenantId);
  }

  @Get(':groupId')
  async get(@Param('groupId') groupId: string) {
    return this.groupService.get(groupId);
  }

  // GET users of a group (frontend sends POST with { group_id })
  @Post('users')
  async usersForGroup(@Body() body: { group_id: string }) {
    return this.groupService.usersForGroup(body.group_id);
  }

  @Post('add-user')
  async addUser(@Body() body: { group_id: string; user_id: string }) {
    await this.groupService.addUser(body.group_id, body.user_id);
    return { message: 'User added to group successfully' };
  }

  @Delete('remove-user')
  async removeUser(@Body() body: { group_id: string; user_id: string }) {
    await this.groupService.removeUser(body.group_id, body.user_id);
    return { message: 'User removed from group successfully' };
  }

  @Post()
  async create(
    @Body() body: { group_data: { name: string; description?: string } },
    @Query('tenant_id') tenantId: string,
  ) {
    const { name, description } = body.group_data;
    return this.groupService.create(tenantId, name, description);
  }

  @Put(':groupId')
  async update(
    @Param('groupId') groupId: string,
    @Body() body: { group_data: { name?: string; description?: string } },
  ) {
    const { name, description } = body.group_data;
    return this.groupService.update(groupId, name, description);
  }

  @Delete(':groupId')
  async delete(@Param('groupId') groupId: string) {
    return this.groupService.delete(groupId);
  }
}
