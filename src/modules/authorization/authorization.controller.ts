import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthorizationService, AuthorizeResult } from './authorization.service.js';
import { Public } from '../auth/public.decorator.js';

export interface AuthorizeRequestDto {
  /** The user performing the action */
  actorUserId: string;
  /** The active tenant context */
  tenantId: string;
  /**
   * The resource being accessed.
   * Convention: module.section[.subsection]
   * Examples: "su.normal", "su.adv", "vid.l2", "iam.users"
   */
  resource: string;
  /**
   * The action being performed.
   * Examples: "view", "respond", "export", "create", "delete"
   */
  action: string;
  /** Optional target entity ID (e.g. query ID, ticket ID) */
  targetId?: string;
  /** Optional ABAC context bag (module, section, level, etc.) */
  context?: Record<string, string>;
}

/**
 * POST /authorize
 *
 * Called by frontend interceptors and backend service-layer guards
 * before executing any business operation.
 *
 * This is the PEP→PDP contract endpoint.
 * Marked @Public() because the caller sends actorUserId explicitly
 * (the JWT guard already validated the token before reaching this controller
 *  in the normal flow; this endpoint is also usable in service-to-service calls).
 *
 * Response shape:
 *   { allowed: true, reason: null }
 *   { allowed: false, reason: "You are not authorized..." }
 */
@Controller('authorize')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async authorize(@Body() dto: AuthorizeRequestDto): Promise<AuthorizeResult> {
    const { actorUserId, tenantId, resource, action, context } = dto;
    return this.authorizationService.authorize(
      actorUserId,
      tenantId,
      resource,
      action,
      context,
    );
  }
}
