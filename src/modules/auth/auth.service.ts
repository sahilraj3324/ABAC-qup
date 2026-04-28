import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../User-management/user/user.service.js';
import { UserRepository } from '../User-management/user/user.repository.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<{
    user: { id: string; email: string; first_name: string; last_name: string; is_active: boolean };
    tenant_id: string | null;
    access_token: string;
  }> {
    const user = await this.userService.authenticate(email, password);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    // Get the user's first tenant membership
    const tenantIds = await this.userRepository.getMemberships(user.id);
    const tenant_id = tenantIds[0] ?? null;

    const payload = {
      sub: user.id,
      email: user.email,
      tenant_id,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active,
      },
      tenant_id,
      access_token,
    };
  }
}
