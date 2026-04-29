import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthorizationService } from '../authorization/authorization.service.js';
import {
  REQUIRE_PERMISSION_KEY,
  PermissionRequirement,
} from './require-permission.decorator.js';
import { JwtPayload } from './jwt-auth.guard.js';

/**
 * Per-route authorization guard (PEP enforcement).
 *
 * Apply after JwtAuthGuard (which populates req.user).
 * This guard reads the @RequirePermission metadata and calls the
 * AuthorizationService to evaluate RBAC + ABAC.
 *
 * If no @RequirePermission is set on a route, the guard passes through.
 *
 * Usage (route-level):
 *   @UseGuards(PermissionGuard)
 *   @RequirePermission('su.adv', 'view')
 *   @Get(...)
 *   handler() {}
 *
 * Or register as a global guard in AppModule after JwtAuthGuard.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<PermissionRequirement | undefined>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permission requirement declared → pass through
    if (!requirement) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user as JwtPayload | undefined;

    if (!user?.sub) {
      throw new UnauthorizedException('User identity not found in request');
    }

    // tenant_id comes from the JWT payload; can be overridden by a query/body param
    const tenantId =
      (request.query['tenant_id'] as string | undefined) ??
      (request.body?.tenant_id as string | undefined) ??
      user.tenant_id;

    if (!tenantId) {
      throw new ForbiddenException('No active tenant context — cannot evaluate permissions');
    }

    const result = await this.authorizationService.authorize(
      user.sub,
      tenantId,
      requirement.resource,
      requirement.action,
    );

    if (!result.allowed) {
      throw new ForbiddenException(result.reason ?? 'Access denied');
    }

    return true;
  }
}
