import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSION_KEY = 'requirePermission';

export interface PermissionRequirement {
  resource: string;
  action: string;
}

/**
 * Declare which resource+action a route requires.
 *
 * Usage:
 *   @RequirePermission('su.adv', 'view')
 *   @Get('spend-usage/advance')
 *   getAdvance() { ... }
 *
 * The PermissionGuard reads this metadata and calls AuthorizationService.
 * The active tenant_id and user sub are taken from the JWT (req.user).
 */
export const RequirePermission = (resource: string, action: string) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, { resource, action } satisfies PermissionRequirement);
