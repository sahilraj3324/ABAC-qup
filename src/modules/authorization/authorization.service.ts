import { Injectable, ForbiddenException } from '@nestjs/common';
import { PermissionResolverService } from './permission-resolver.service.js';
import { AbacPolicyService } from './abac-policy.service.js';

export interface AuthorizeResult {
  allowed: boolean;
  reason: string | null;
}

/**
 * Authorization Facade — PDP (Policy Decision Point)
 *
 * Single entry point for all authorization decisions.
 * Steps:
 *   1. Tenant membership check (PIP)
 *   2. RBAC check — does user have the required permission? (PIP → PermissionResolver)
 *   3. ABAC evaluation — contextual constraints (PolicyEvaluator)
 *
 * Usage:
 *   const result = await authorizationService.authorize(userId, tenantId, 'su.adv', 'view');
 *   if (!result.allowed) throw new ForbiddenException(result.reason);
 */
@Injectable()
export class AuthorizationService {
  constructor(
    private readonly resolver: PermissionResolverService,
    private readonly abac: AbacPolicyService,
  ) {}

  /**
   * Full authorization check: tenant + RBAC + ABAC.
   * Returns a decision object — callers decide whether to throw or handle.
   */
  async authorize(
    userId: string,
    tenantId: string,
    resource: string,
    action: string,
    context?: Record<string, string>,
  ): Promise<AuthorizeResult> {
    // Step 1: Tenant membership (PIP)
    const isMember = await this.resolver.isTenantMember(userId, tenantId);
    if (!isMember) {
      return {
        allowed: false,
        reason: `User does not belong to tenant '${tenantId}'`,
      };
    }

    // Step 2: Resolve effective RBAC permissions (PIP)
    const permissions = await this.resolver.getEffectivePermissions(userId, tenantId);

    // Step 3: ABAC evaluation
    const decision = this.abac.evaluate({ resource, action, permissions, context });

    return decision;
  }

  /**
   * Convenience method — throws ForbiddenException if not allowed.
   * Use this inside route handlers or guards.
   */
  async authorizeOrThrow(
    userId: string,
    tenantId: string,
    resource: string,
    action: string,
    context?: Record<string, string>,
  ): Promise<void> {
    const result = await this.authorize(userId, tenantId, resource, action, context);
    if (!result.allowed) {
      throw new ForbiddenException(result.reason ?? 'You are not authorized to access this resource');
    }
  }
}
