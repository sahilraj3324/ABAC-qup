import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * GET /auth/login/public-key
   * Returning 404-equivalent empty so that secureLogin.ts falls back to plain login.
   * Implement RSA here if you want encrypted credential transport.
   */
  @Get('login/public-key')
  getPublicKey() {
    // Not implemented — frontend secureLogin.ts will catch and fall back to plain login
    return { error: 'RSA login not configured' };
  }

  /**
   * POST /auth/login
   * Accepts plain { email, password } — the secure-login fallback path.
   */
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }
}
