import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantRepository } from './tenant.repository.interface.js';
import { UserRepository } from '../user/user.repository.interface.js';
import { RoleRepository } from '../role/role.repository.interface.js';
import { TenantEntity } from './tenant.entity.js';
import * as bcrypt from 'bcryptjs';

const OWNER = 'OWNER';
const ADMIN = 'ADMIN';
const USER_ROLE = 'USER';

@Injectable()
export class TenantService {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly users: UserRepository,
    private readonly roles: RoleRepository,
  ) { }

  async createWithOwner(name: string, ownerEmail: string, ownerPassword: string, first: string, last: string) {
    if (!name?.trim()) throw new BadRequestException('Tenant name cannot be empty');
    if (name.trim().length > 100) throw new BadRequestException('Tenant name cannot exceed 100 characters');
    if (!ownerEmail?.trim()) throw new BadRequestException('Owner email cannot be empty');
    if (!ownerPassword || ownerPassword.length < 8) throw new BadRequestException('Owner password must be at least 8 characters long');
    if (!first?.trim()) throw new BadRequestException('Owner first name cannot be empty');
    if (!last?.trim()) throw new BadRequestException('Owner last name cannot be empty');

    if (await this.tenants.existsByName(name.trim())) {
      throw new BadRequestException('Tenant with this name already exists');
    }

    const t = await this.tenants.create(name.trim());

    await this.roles.ensure(t.id, OWNER, 'Full access including tenant deletion');
    await this.roles.ensure(t.id, ADMIN, 'Full access except tenant deletion');
    await this.roles.ensure(t.id, USER_ROLE, 'No permissions by default');

    const passwordHash = await bcrypt.hash(ownerPassword, 10);
    const owner = await this.users.createLocal(ownerEmail.trim().toLowerCase(), passwordHash, first.trim(), last.trim());

    await this.users.addMembership(owner.id, t.id);
    const ownerRole = await this.roles.getByName(t.id, OWNER);
    await this.roles.assignUserRole(owner.id, ownerRole!.id, t.id);

    return { tenant_id: t.id, owner_user_id: owner.id };
  }

  async get(tenantId: string): Promise<TenantEntity> {
    const tenant = await this.tenants.get(tenantId);
    if (!tenant) throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    return tenant;
  }

  async getOptional(tenantId: string): Promise<TenantEntity | null> {
    return this.tenants.get(tenantId);
  }

  async listAll(): Promise<{ tenants: TenantEntity[]; total: number }> {
    const tenants = await this.tenants.listAll();
    return { tenants, total: tenants.length };
  }

  async update(tenantId: string, name?: string | null, isActive?: boolean | null): Promise<TenantEntity> {
    const existing = await this.tenants.get(tenantId);
    if (!existing) throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    if (name !== undefined && name !== null && (!name.trim() || name.trim().length > 100)) {
      throw new BadRequestException('Tenant name cannot be empty or exceed 100 characters');
    }
    const result = await this.tenants.update(tenantId, name?.trim() ?? null, isActive ?? null);
    if (!result) throw new BadRequestException(`Failed to update tenant ${tenantId}`);
    return result;
  }

  async delete(tenantId: string): Promise<{ tenant_id: string; message: string }> {
    const existing = await this.tenants.get(tenantId);
    if (!existing) throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    await this.tenants.delete(tenantId);
    return { tenant_id: tenantId, message: 'Tenant deleted successfully' };
  }
}
