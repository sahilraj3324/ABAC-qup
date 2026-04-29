import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
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

  async login(
    email: string,
    password: string,
    /** Optionally pass a tenant_id at login to select a specific tenant context */
    requestedTenantId?: string | null,
  ): Promise<{
    user: { id: string; email: string; first_name: string; last_name: string; is_active: boolean };
    tenant_id: string | null;
    /** All tenants the user belongs to, for frontend tenant-switcher */
    tenants: string[];
    access_token: string;
  }> {
    const user = await this.userService.authenticate(email, password);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    // Resolve all tenant memberships
    const tenantIds = await this.userRepository.getMemberships(user.id);

    let activeTenantId: string | null = null;

    if (requestedTenantId) {
      // Validate the requested tenant is one the user belongs to
      if (!tenantIds.includes(requestedTenantId)) {
        throw new BadRequestException(`User does not belong to tenant '${requestedTenantId}'`);
      }
      activeTenantId = requestedTenantId;
    } else {
      // Default to first tenant
      activeTenantId = tenantIds[0] ?? null;
    }

    const payload = {
      sub: user.id,
      email: user.email,
      tenant_id: activeTenantId,
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
      tenant_id: activeTenantId,
      tenants: tenantIds,
      access_token,
    };
  }

  /**
   * Issue a new JWT for the same user but a different tenant.
   * Called by a /auth/switch-tenant endpoint.
   */
  async switchTenant(
    userId: string,
    currentEmail: string,
    targetTenantId: string,
  ): Promise<{ tenant_id: string; access_token: string }> {
    const tenantIds = await this.userRepository.getMemberships(userId);
    if (!tenantIds.includes(targetTenantId)) {
      throw new BadRequestException(`User does not belong to tenant '${targetTenantId}'`);
    }

    const payload = { sub: userId, email: currentEmail, tenant_id: targetTenantId };
    const access_token = await this.jwtService.signAsync(payload);
    return { tenant_id: targetTenantId, access_token };
  }
}
