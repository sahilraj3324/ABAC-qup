import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { Public } from './public.decorator.js';
import { JwtPayload } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * GET /auth/login/public-key
   * Not implemented — frontend secureLogin.ts falls back to plain login.
   */
  @Public()
  @Get('login/public-key')
  getPublicKey() {
    return { error: 'RSA login not configured' };
  }

  /**
   * POST /auth/login
   * Accepts { email, password, tenant_id? }
   * Returns JWT + user + list of all tenants the user belongs to.
   */
  @Public()
  @Post('login')
  async login(@Body() body: { email: string; password: string; tenant_id?: string }) {
    return this.authService.login(body.email, body.password, body.tenant_id);
  }

  /**
   * POST /auth/switch-tenant
   * Issues a new JWT for the same authenticated user but a different tenant.
   * Requires a valid JWT (not @Public).
   * Body: { tenant_id: string }
   * The caller must send their current Bearer token.
   */
  @Post('switch-tenant')
  async switchTenant(
    @Body() body: { tenant_id: string },
    // req.user is populated by JwtAuthGuard (global)
    // We pull it from the request via a custom param or just use body
    // For simplicity, ask caller to also pass user_id; or use a CurrentUser decorator
  ) {
    // The global guard has already validated the token.
    // We read the user from the decorated parameter below.
    // Since we don't have a @CurrentUser decorator yet, we accept user_id explicitly.
    // TODO: add @CurrentUser() decorator later and remove user_id from body.
    return { message: 'Use POST /auth/login with tenant_id param to switch tenants for now.' };
  }
}

