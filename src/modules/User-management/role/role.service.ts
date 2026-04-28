import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RoleRepository } from './role.repository.interface.js';
import { RoleEntity } from './role.entity.js';

@Injectable()
export class RoleService {
  constructor(private readonly roles: RoleRepository) {}

  async ensure(tenantId: string, name: string, desc?: string | null): Promise<RoleEntity> {
    if (!name?.trim()) throw new BadRequestException('Role name cannot be empty');
    if (name.trim().length > 50) throw new BadRequestException('Role name cannot exceed 50 characters');
    if (desc && desc.trim().length > 255) throw new BadRequestException('Role description cannot exceed 255 characters');
    return this.roles.ensure(tenantId, name.trim(), desc?.trim() ?? null);
  }

  async get(roleId: string): Promise<RoleEntity> {
    const role = await this.roles.get(roleId);
    if (!role) throw new NotFoundException(`Role with ID ${roleId} not found`);
    return role;
  }

  async getOptional(roleId: string): Promise<RoleEntity | null> {
    return this.roles.get(roleId);
  }

  async getByName(tenantId: string, name: string): Promise<RoleEntity> {
    if (!name?.trim()) throw new BadRequestException('Role name cannot be empty');
    const role = await this.roles.getByName(tenantId, name.trim());
    if (!role) throw new NotFoundException(`Role '${name}' not found in tenant ${tenantId}`);
    return role;
  }

  async listByTenant(tenantId: string) {
    const roles = await this.roles.listByTenant(tenantId);
    return { roles, total: roles.length, tenant_id: tenantId };
  }

  async listAll() {
    const roles = await this.roles.listAll();
    return { roles, total: roles.length };
  }

  async assignUserRole(userId: string, roleId: string, tenantId: string): Promise<void> {
    await this.roles.assignUserRole(userId, roleId, tenantId);
  }

  async removeUserRole(userId: string, roleId: string, tenantId: string): Promise<void> {
    await this.roles.removeUserRole(userId, roleId, tenantId);
  }

  async getRoleNamesForUser(userId: string, tenantId: string): Promise<string[]> {
    return this.roles.getRoleNamesForUser(userId, tenantId);
  }

  async getRolesForUser(userId: string, tenantId: string) {
    const roles = await this.roles.getRolesForUser(userId, tenantId);
    return { user_id: userId, tenant_id: tenantId, roles, total: roles.length };
  }

  async update(roleId: string, name?: string | null, description?: string | null): Promise<void> {
    const existing = await this.roles.get(roleId);
    if (!existing) throw new NotFoundException(`Role with ID ${roleId} not found`);
    if (name !== undefined && name !== null && !name.trim()) throw new BadRequestException('Role name cannot be empty');
    await this.roles.update(roleId, name, description);
  }

  async delete(roleId: string): Promise<{ role_id: string; message: string }> {
    const existing = await this.roles.get(roleId);
    if (!existing) throw new NotFoundException(`Role with ID ${roleId} not found`);
    await this.roles.delete(roleId);
    return { role_id: roleId, message: 'Role deleted successfully' };
  }
}
