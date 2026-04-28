import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { GroupRepository } from './group.repository.interface.js';
import { GroupEntity } from './group.entity.js';

@Injectable()
export class GroupService {
  constructor(private readonly groups: GroupRepository) {}

  async create(tenantId: string, name: string, description?: string | null): Promise<GroupEntity> {
    if (!name?.trim()) throw new BadRequestException('Group name cannot be empty');
    if (name.trim().length > 100) throw new BadRequestException('Group name cannot exceed 100 characters');
    if (description && description.trim().length > 500) throw new BadRequestException('Group description cannot exceed 500 characters');
    return this.groups.create(tenantId, name.trim(), description?.trim() ?? null);
  }

  async get(groupId: string): Promise<GroupEntity> {
    const group = await this.groups.get(groupId);
    if (!group) throw new NotFoundException(`Group with ID ${groupId} not found`);
    return group;
  }

  async getOptional(groupId: string): Promise<GroupEntity | null> {
    return this.groups.get(groupId);
  }

  async listByTenant(tenantId: string) {
    const groups = await this.groups.listByTenant(tenantId);
    return { groups, total: groups.length, tenant_id: tenantId };
  }

  async update(groupId: string, name?: string | null, description?: string | null): Promise<GroupEntity> {
    const existing = await this.groups.get(groupId);
    if (!existing) throw new NotFoundException(`Group with ID ${groupId} not found`);
    if (name !== undefined && name !== null && (!name.trim() || name.trim().length > 100)) {
      throw new BadRequestException('Group name cannot be empty or exceed 100 characters');
    }
    if (description !== undefined && description !== null && description.trim().length > 500) {
      throw new BadRequestException('Group description cannot exceed 500 characters');
    }
    const result = await this.groups.update(groupId, name?.trim() ?? null, description?.trim() ?? null);
    if (!result) throw new BadRequestException(`Failed to update group ${groupId}`);
    return result;
  }

  async delete(groupId: string): Promise<{ group_id: string; message: string }> {
    const existing = await this.groups.get(groupId);
    if (!existing) throw new NotFoundException(`Group with ID ${groupId} not found`);
    await this.groups.delete(groupId);
    return { group_id: groupId, message: 'Group deleted successfully' };
  }

  async addUser(groupId: string, userId: string): Promise<void> {
    const existing = await this.groups.get(groupId);
    if (!existing) throw new NotFoundException(`Group with ID ${groupId} not found`);
    await this.groups.addUser(userId, groupId);
  }

  async removeUser(groupId: string, userId: string): Promise<void> {
    const existing = await this.groups.get(groupId);
    if (!existing) throw new NotFoundException(`Group with ID ${groupId} not found`);
    const removed = await this.groups.removeUser(userId, groupId);
    if (!removed) throw new NotFoundException(`User ${userId} is not a member of group ${groupId}`);
  }

  async groupsForUser(userId: string, tenantId: string) {
    const groups = await this.groups.groupsForUser(userId, tenantId);
    return { user_id: userId, tenant_id: tenantId, groups, total: groups.length };
  }

  async usersForGroup(groupId: string) {
    const existing = await this.groups.get(groupId);
    if (!existing) throw new NotFoundException(`Group with ID ${groupId} not found`);
    const users = await this.groups.usersForGroup(groupId);
    return { group_id: groupId, users, total: users.length };
  }
}
