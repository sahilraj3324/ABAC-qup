import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../../database/database.module.js';
import { UserRepository } from './user.repository.interface.js';
import { UserEntity } from './user.entity.js';

function rowToUser(r: any): UserEntity {
  return {
    id: r.id,
    email: r.email,
    first_name: r.first_name,
    last_name: r.last_name,
    is_active: r.is_active,
    created_at: r.created_at,
    updated_at: r.updated_at,
    mfa_enabled: r.mfa_enabled ?? false,
  };
}

@Injectable()
export class UserRepositoryImpl extends UserRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {
    super();
  }

  async createLocal(email: string, passwordHash: string, first: string, last: string): Promise<UserEntity> {
    const res = await this.pool.query(
      `INSERT INTO dev.qup_users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name, is_active, created_at, updated_at`,
      [email, passwordHash, first, last],
    );
    return rowToUser(res.rows[0]);
  }

  async get(userId: string): Promise<UserEntity | null> {
    const res = await this.pool.query(
      `SELECT id, email, first_name, last_name, is_active, created_at, updated_at
       FROM dev.qup_users WHERE id = $1`,
      [userId],
    );
    return res.rows[0] ? rowToUser(res.rows[0]) : null;
  }

  async getByEmail(email: string): Promise<UserEntity | null> {
    const res = await this.pool.query(
      `SELECT id, email, first_name, last_name, is_active, created_at, updated_at
       FROM dev.qup_users WHERE email = $1`,
      [email],
    );
    return res.rows[0] ? rowToUser(res.rows[0]) : null;
  }

  async listByTenant(tenantId: string): Promise<UserEntity[]> {
    const res = await this.pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, u.created_at, u.updated_at
       FROM dev.qup_users u
       INNER JOIN dev.qup_user_tenants ut ON u.id = ut.user_id
       WHERE ut.tenant_id = $1
       ORDER BY u.created_at DESC`,
      [tenantId],
    );
    return res.rows.map(rowToUser);
  }

  async listAll(): Promise<UserEntity[]> {
    const res = await this.pool.query(
      `SELECT id, email, first_name, last_name, is_active, created_at, updated_at
       FROM dev.qup_users ORDER BY created_at DESC`,
    );
    return res.rows.map(rowToUser);
  }

  async update(userId: string, first: string | null, last: string | null, isActive: boolean | null): Promise<UserEntity | null> {
    const res = await this.pool.query(
      `UPDATE dev.qup_users
       SET first_name = COALESCE($1, first_name),
           last_name  = COALESCE($2, last_name),
           is_active  = COALESCE($3, is_active),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, email, first_name, last_name, is_active, created_at, updated_at`,
      [first, last, isActive, userId],
    );
    return res.rows[0] ? rowToUser(res.rows[0]) : null;
  }

  async delete(userId: string): Promise<boolean> {
    const res = await this.pool.query(
      `DELETE FROM dev.qup_users WHERE id = $1`,
      [userId],
    );
    return res.rowCount! > 0;
  }

  async addMembership(userId: string, tenantId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO dev.qup_user_tenants (user_id, tenant_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, tenantId],
    );
  }

  async isMemberOfTenant(userId: string, tenantId: string): Promise<boolean> {
    const res = await this.pool.query(
      `SELECT 1 FROM dev.qup_user_tenants WHERE user_id = $1 AND tenant_id = $2 LIMIT 1`,
      [userId, tenantId],
    );
    return res.rowCount! > 0;
  }

  async getPasswordHash(email: string): Promise<string | null> {
    const res = await this.pool.query(
      `SELECT password_hash FROM dev.qup_users WHERE email = $1`,
      [email],
    );
    return res.rows[0]?.password_hash ?? null;
  }

  async updatePassword(userId: string, newPasswordHash: string): Promise<boolean> {
    const res = await this.pool.query(
      `UPDATE dev.qup_users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [newPasswordHash, userId],
    );
    return res.rowCount! > 0;
  }

  async getUserTenants(userId: string): Promise<string[]> {
    const res = await this.pool.query(
      `SELECT tenant_id FROM dev.qup_user_tenants
       WHERE user_id = $1 ORDER BY tenant_id`,
      [userId],
    );
    return res.rows.map((r) => r.tenant_id);
  }

  async getMfaData(userId: string): Promise<[boolean, string | null, string[] | null]> {
    const res = await this.pool.query(
      `SELECT mfa_enabled, mfa_secret, mfa_backup_codes FROM dev.qup_users WHERE id = $1`,
      [userId],
    );
    if (!res.rows[0]) return [false, null, null];
    const r = res.rows[0];
    return [
      Boolean(r.mfa_enabled),
      r.mfa_secret ?? null,
      r.mfa_backup_codes ? (r.mfa_backup_codes as string[]) : null,
    ];
  }

  async updateMfa(userId: string, enabled: boolean, secret: string | null, backupCodes: string[] | null): Promise<boolean> {
    const res = await this.pool.query(
      `UPDATE dev.qup_users
       SET mfa_enabled = $1, mfa_secret = $2, mfa_backup_codes = $3, updated_at = NOW()
       WHERE id = $4`,
      [enabled, secret, backupCodes, userId],
    );
    return res.rowCount! > 0;
  }
}
