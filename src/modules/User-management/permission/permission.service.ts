import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PermissionRepository } from './permission.repository.interface.js';
import { PermissionEntity } from './permission.entity.js';

@Injectable()
export class PermissionService {
  constructor(private readonly perms: PermissionRepository) {}

  async ensure(code: string, name: string, description?: string | null): Promise<PermissionEntity> {
    if (!code?.trim()) throw new BadRequestException('Permission code cannot be empty');
    if (!name?.trim()) throw new BadRequestException('Permission name cannot be empty');
    if (code.trim().length > 100) throw new BadRequestException('Permission code cannot exceed 100 characters');
    if (name.trim().length > 255) throw new BadRequestException('Permission name cannot exceed 255 characters');
    if (description && description.trim().length > 500) throw new BadRequestException('Permission description cannot exceed 500 characters');
    return this.perms.ensure(code.trim(), name.trim(), description?.trim() ?? null);
  }

  async get(permissionId: string): Promise<PermissionEntity> {
    const perm = await this.perms.get(permissionId);
    if (!perm) throw new NotFoundException(`Permission with ID ${permissionId} not found`);
    return perm;
  }

  async getByCode(code: string): Promise<PermissionEntity> {
    if (!code?.trim()) throw new BadRequestException('Permission code cannot be empty');
    const perm = await this.perms.getByCode(code.trim());
    if (!perm) throw new NotFoundException(`Permission with code '${code}' not found`);
    return perm;
  }

  async listAll() {
    const permissions = await this.perms.listAll();
    return { permissions, total: permissions.length };
  }

  async update(permissionId: string, code?: string | null, name?: string | null, description?: string | null): Promise<void> {
    const existing = await this.perms.get(permissionId);
    if (!existing) throw new NotFoundException(`Permission with ID ${permissionId} not found`);
    if (code !== undefined && code !== null && !code.trim()) throw new BadRequestException('Permission code cannot be empty');
    if (name !== undefined && name !== null && !name.trim()) throw new BadRequestException('Permission name cannot be empty');
    await this.perms.update(permissionId, code, name, description);
  }

  async delete(permissionId: string): Promise<{ permission_id: string; message: string }> {
    const existing = await this.perms.get(permissionId);
    if (!existing) throw new NotFoundException(`Permission with ID ${permissionId} not found`);
    await this.perms.delete(permissionId);
    return { permission_id: permissionId, message: 'Permission deleted successfully' };
  }

  async grantToRole(roleId: string, permissionId: string): Promise<void> {
    await this.perms.grantToRole(roleId, permissionId);
  }

  async revokeFromRole(roleId: string, permissionId: string): Promise<void> {
    await this.perms.revokeFromRole(roleId, permissionId);
  }

  async getPermissionsForRole(roleId: string): Promise<PermissionEntity[]> {
    return this.perms.getForRole(roleId);
  }

  async effectiveCodes(userId: string, tenantId: string): Promise<{ user_id: string; tenant_id: string; permissions: string[]; total: number }> {
    const codes = await this.perms.getEffectiveCodes(userId, tenantId);
    const list = [...codes];
    return { user_id: userId, tenant_id: tenantId, permissions: list, total: list.length };
  }
}
