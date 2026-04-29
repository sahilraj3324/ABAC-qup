import { PermissionEntity } from './permission.entity.js';

export abstract class PermissionRepository {
  abstract ensure(code: string, name: string, desc: string | null): Promise<PermissionEntity>;
  abstract get(permissionId: string): Promise<PermissionEntity | null>;
  abstract getByCode(code: string): Promise<PermissionEntity | null>;
  abstract listAll(): Promise<PermissionEntity[]>;
  abstract update(permissionId: string, code?: string | null, name?: string | null, description?: string | null): Promise<boolean>;
  abstract delete(permissionId: string): Promise<boolean>;
  abstract grantToRole(roleId: string, permissionId: string): Promise<void>;
  abstract revokeFromRole(roleId: string, permissionId: string): Promise<boolean>;
  abstract getForRole(roleId: string): Promise<PermissionEntity[]>;
  abstract getEffectiveCodes(userId: string, tenantId: string): Promise<Set<string>>;
}
