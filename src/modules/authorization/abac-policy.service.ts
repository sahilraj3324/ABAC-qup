import { Injectable } from '@nestjs/common';

export interface AbacContext {
  /** The resource key being accessed, e.g. "su.normal", "su.adv", "vid.l2" */
  resource: string;
  /** The action being performed, e.g. "view", "respond", "export" */
  action: string;
  /** The user's effective RBAC permission codes for this tenant */
  permissions: Set<string>;
  /** Optional: additional context passed in the request */
  context?: Record<string, string>;
}

export interface AbacDecision {
  allowed: boolean;
  reason: string | null;
}

/**
 * ABAC Policy Evaluator
 *
 * Rules are defined here in code (not stored in DB).
 * Pattern: if the user's RBAC permissions contain the resource+action code,
 * and any contextual ABAC constraints also pass, access is ALLOWED.
 *
 * Current strategy: permission code IS the resource.action key.
 * E.g. permission code "su.access" gates all of Spend & Usage.
 *      permission code "su.adv.view" gates the Advance tab view.
 *      permission code "vid.l2.respond" gates VidURA Level 2 respond.
 *
 * ABAC context rules can be layered on top per resource prefix.
 */
@Injectable()
export class AbacPolicyService {
  /**
   * Evaluate ABAC policy.
   * Returns ALLOW if the user's permission set satisfies the resource+action constraint.
   */
  evaluate(ctx: AbacContext): AbacDecision {
    const { resource, action, permissions } = ctx;

    // Build the specific permission code to check: "resource.action"
    const specificCode = `${resource}.${action}`.toLowerCase();

    // Build the broad resource-level code: "resource" (access to entire section)
    const broadCode = resource.toLowerCase();

    // 1. Check specific action code first (e.g. "su.adv.view")
    if (permissions.has(specificCode)) {
      return { allowed: true, reason: null };
    }

    // 2. Check broad resource access code (e.g. "su.access" gates entire SU module)
    if (permissions.has(broadCode)) {
      return { allowed: true, reason: null };
    }

    // 3. Apply module-level fallback rules
    const moduleAccess = this.getModuleAccessCode(resource);
    if (moduleAccess && permissions.has(moduleAccess)) {
      return { allowed: true, reason: null };
    }

    return {
      allowed: false,
      reason: `Access denied: you do not have permission to perform '${action}' on '${resource}'`,
    };
  }

  /**
   * Maps a resource key to its top-level module access permission code.
   * If a user has the top-level access code, they can access any sub-resource in that module.
   *
   * Extend this map as you add new modules.
   */
  private getModuleAccessCode(resource: string): string | null {
    const r = resource.toLowerCase();

    if (r.startsWith('su.')) return 'su.access';          // Spend & Usage
    if (r.startsWith('vid.')) return 'vid.access';        // VIDURA
    if (r.startsWith('al.')) return 'al.access';          // Alert
    if (r.startsWith('cs.')) return 'cs.access';          // Client Success
    if (r.startsWith('iam.')) return 'iam.access';        // IAM / User Management

    return null;
  }
}
