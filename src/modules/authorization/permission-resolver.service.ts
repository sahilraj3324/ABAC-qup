import { Injectable } from '@nestjs/common';
import { PermissionRepository } from '../User-management/permission/permission.repository.interface.js';
import { UserRepository } from '../User-management/user/user.repository.interface.js';

/**
 * PIP — Policy Information Point
 * Aggregates all data needed by the PDP to make authorization decisions.
 */
@Injectable()
export class PermissionResolverService {
  constructor(
    private readonly permissionRepo: PermissionRepository,
    private readonly userRepo: UserRepository,
  ) {}

  /**
   * Resolve the effective set of permission codes for a user in a tenant.
   * This covers RBAC: user_roles → role_permissions → permission_types
   */
  async getEffectivePermissions(userId: string, tenantId: string): Promise<Set<string>> {
    return this.permissionRepo.getEffectiveCodes(userId, tenantId);
  }

  /**
   * Check if the user is a member of the given tenant.
   */
  async isTenantMember(userId: string, tenantId: string): Promise<boolean> {
    return this.userRepo.isMemberOfTenant(userId, tenantId);
  }
}
