import { RoleEntity } from './role.entity.js';

export abstract class RoleRepository {
  abstract ensure(tenantId: string, name: string, desc: string | null): Promise<RoleEntity>;
  abstract get(roleId: string): Promise<RoleEntity | null>;
  abstract getByName(tenantId: string, name: string): Promise<RoleEntity | null>;
  abstract listByTenant(tenantId: string): Promise<RoleEntity[]>;
  abstract listAll(): Promise<RoleEntity[]>;
  abstract update(roleId: string, name?: string | null, description?: string | null): Promise<boolean>;
  abstract delete(roleId: string): Promise<boolean>;
  abstract assignUserRole(userId: string, roleId: string, tenantId: string): Promise<void>;
  abstract removeUserRole(userId: string, roleId: string, tenantId: string): Promise<boolean>;
  abstract getRoleNamesForUser(userId: string, tenantId: string): Promise<string[]>;
  abstract getRolesForUser(userId: string, tenantId: string): Promise<{ id: string; name: string; description: string | null }[]>;
}
