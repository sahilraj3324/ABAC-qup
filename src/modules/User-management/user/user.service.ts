import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRepository } from './user.repository.interface.js';
import { RoleRepository } from '../role/role.repository.interface.js';
import { UserEntity } from './user.entity.js';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';


const OWNER = 'OWNER';
const ADMIN = 'ADMIN';

@Injectable()
export class UserService {
  constructor(
    private readonly users: UserRepository,
    private readonly roles: RoleRepository,
  ) { }

  async registerLocal(
    email: string,
    password: string,
    first: string,
    last: string,
    tenantId: string,
    actorId: string,
    roleId?: string | null,
  ) {
    if (!email?.trim()) throw new BadRequestException('Email cannot be empty');
    if (!password || password.length < 8) throw new BadRequestException('Password must be at least 8 characters long');
    if (!first?.trim()) throw new BadRequestException('First name cannot be empty');
    if (!last?.trim()) throw new BadRequestException('Last name cannot be empty');

    const actorRoles = await this.roles.getRoleNamesForUser(actorId, tenantId);
    if (!actorRoles.some((r) => r === OWNER || r === ADMIN)) {
      throw new ForbiddenException('User registration requires OWNER or ADMIN privileges');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const u = await this.users.createLocal(email.trim().toLowerCase(), passwordHash, first.trim(), last.trim());
    await this.users.addMembership(u.id, tenantId);

    if (roleId) {
      await this.roles.assignUserRole(u.id, roleId, tenantId);
    }

    return { user_id: u.id, email: u.email, first_name: u.first_name, last_name: u.last_name, is_active: u.is_active };
  }

  // No actor check — used by controller before auth is wired
  async createDirect(email: string, password: string, first: string, last: string, tenantId: string, roleId?: string | null) {
    if (!email?.trim()) throw new BadRequestException('Email cannot be empty');
    if (!password || password.length < 8) throw new BadRequestException('Password must be at least 8 characters long');
    if (!first?.trim()) throw new BadRequestException('First name cannot be empty');
    if (!last?.trim()) throw new BadRequestException('Last name cannot be empty');
    const passwordHash = await bcrypt.hash(password, 10);
    const u = await this.users.createLocal(email.trim().toLowerCase(), passwordHash, first.trim(), last.trim());
    if (tenantId) await this.users.addMembership(u.id, tenantId);
    if (roleId && tenantId) await this.roles.assignUserRole(u.id, roleId, tenantId);
    return { user_id: u.id, email: u.email, first_name: u.first_name, last_name: u.last_name, is_active: u.is_active };
  }

  async authenticate(email: string, password: string): Promise<UserEntity | null> {
    if (!email || !password) return null;
    const ph = await this.users.getPasswordHash(email.trim().toLowerCase());
    if (!ph) return null;

    let valid = false;

    if (ph.startsWith('$2b$') || ph.startsWith('$2a$')) {
      // New bcrypt hash
      valid = await bcrypt.compare(password, ph);
    } else {
      // Legacy Python SHA256 hash: hashlib.sha256(password.encode()).hexdigest()
      const sha256 = createHash('sha256').update(password).digest('hex');
      valid = sha256 === ph;
      if (valid) {
        // Silently upgrade to bcrypt on first successful login
        const newHash = await bcrypt.hash(password, 10);
        const user = await this.users.getByEmail(email.trim().toLowerCase());
        if (user) await this.users.updatePassword(user.id, newHash);
      }
    }

    if (!valid) return null;
    return this.users.getByEmail(email.trim().toLowerCase());
  }

  async promoteAdmin(targetUserId: string, tenantId: string, actorId: string): Promise<void> {
    const actorRoles = await this.roles.getRoleNamesForUser(actorId, tenantId);
    if (!actorRoles.includes(OWNER)) throw new ForbiddenException('Only OWNER can assign ADMIN privileges');
    const adminRole = await this.roles.getByName(tenantId, ADMIN);
    if (!adminRole) throw new NotFoundException(`ADMIN role not found in tenant ${tenantId}`);
    await this.roles.assignUserRole(targetUserId, adminRole.id, tenantId);
  }

  async demoteAdmin(targetUserId: string, tenantId: string, actorId: string): Promise<void> {
    const actorRoles = await this.roles.getRoleNamesForUser(actorId, tenantId);
    if (!actorRoles.includes(OWNER)) throw new ForbiddenException('Only OWNER can remove ADMIN privileges');
    const adminRole = await this.roles.getByName(tenantId, ADMIN);
    if (!adminRole) throw new NotFoundException(`ADMIN role not found in tenant ${tenantId}`);
    await this.roles.removeUserRole(targetUserId, adminRole.id, tenantId);
  }

  async get(userId: string): Promise<UserEntity> {
    const user = await this.users.get(userId);
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    return user;
  }

  async getOptional(userId: string): Promise<UserEntity | null> {
    return this.users.get(userId);
  }

  async getByEmail(email: string): Promise<UserEntity> {
    if (!email?.trim()) throw new BadRequestException('Email cannot be empty');
    const user = await this.users.getByEmail(email.trim().toLowerCase());
    if (!user) throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  async getByEmailOptional(email: string): Promise<UserEntity | null> {
    if (!email?.trim()) return null;
    return this.users.getByEmail(email.trim().toLowerCase());
  }

  async listByTenant(tenantId: string) {
    const userList = await this.users.listByTenant(tenantId);
    const usersWithRoles = await Promise.all(
      userList.map(async (user) => {
        const roles = await this.roles.getRolesForUser(user.id, tenantId);
        return {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_active: user.is_active,
          roles,
        };
      }),
    );
    return { users: usersWithRoles, total: userList.length, tenant_id: tenantId };
  }

  async listAll() {
    const users = await this.users.listAll();
    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        is_active: u.is_active,
        created_at: u.created_at?.toISOString() ?? null,
        updated_at: u.updated_at?.toISOString() ?? null,
      })),
      total: users.length,
    };
  }

  async update(userId: string, first?: string | null, last?: string | null, isActive?: boolean | null): Promise<UserEntity> {
    const existing = await this.users.get(userId);
    if (!existing) throw new NotFoundException(`User with ID ${userId} not found`);
    if (first !== undefined && first !== null && (!first.trim() || first.trim().length > 100)) {
      throw new BadRequestException('First name cannot be empty or exceed 100 characters');
    }
    if (last !== undefined && last !== null && (!last.trim() || last.trim().length > 100)) {
      throw new BadRequestException('Last name cannot be empty or exceed 100 characters');
    }
    const result = await this.users.update(userId, first?.trim() ?? null, last?.trim() ?? null, isActive ?? null);
    if (!result) throw new BadRequestException(`Failed to update user ${userId}`);
    return result;
  }

  async delete(userId: string): Promise<{ user_id: string; message: string }> {
    const existing = await this.users.get(userId);
    if (!existing) throw new NotFoundException(`User with ID ${userId} not found`);
    await this.users.delete(userId);
    return { user_id: userId, message: 'User deleted successfully' };
  }

  async updatePassword(userId: string, newPassword: string): Promise<{ user_id: string; message: string }> {
    if (!newPassword || newPassword.length < 8) throw new BadRequestException('New password must be at least 8 characters long');
    const existing = await this.users.get(userId);
    if (!existing) throw new NotFoundException(`User with ID ${userId} not found`);
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.users.updatePassword(userId, hashed);
    return { user_id: userId, message: 'Password updated successfully' };
  }

  async getUserTenants(userId: string): Promise<{ user_id: string; tenants: string[]; total: number }> {
    const existing = await this.users.get(userId);
    if (!existing) throw new NotFoundException(`User with ID ${userId} not found`);
    const tenants = await this.users.getUserTenants(userId);
    return { user_id: userId, tenants, total: tenants.length };
  }
}
