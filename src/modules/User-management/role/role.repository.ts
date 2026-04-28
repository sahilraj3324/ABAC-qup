import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../../database/database.module.js';
import { RoleRepository } from './role.repository.interface.js';
import { RoleEntity } from './role.entity.js';

function rowToRole(r: any): RoleEntity {
  return { id: r.id, tenant_id: r.tenant_id, name: r.name, description: r.description ?? null };
}

@Injectable()
export class RoleRepositoryImpl extends RoleRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {
    super();
  }

  async ensure(tenantId: string, name: string, desc: string | null): Promise<RoleEntity> {
    const sel = await this.pool.query(
      `SELECT id, tenant_id, name, description FROM dev.qup_roles
       WHERE tenant_id = $1 AND name = $2`,
      [tenantId, name],
    );
    if (sel.rows[0]) return rowToRole(sel.rows[0]);
    const ins = await this.pool.query(
      `INSERT INTO dev.qup_roles (tenant_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, tenant_id, name, description`,
      [tenantId, name, desc],
    );
    return rowToRole(ins.rows[0]);
  }

  async get(roleId: string): Promise<RoleEntity | null> {
    const res = await this.pool.query(
      `SELECT id, tenant_id, name, description FROM dev.qup_roles WHERE id = $1`,
      [roleId],
    );
    return res.rows[0] ? rowToRole(res.rows[0]) : null;
  }

  async getByName(tenantId: string, name: string): Promise<RoleEntity | null> {
    const res = await this.pool.query(
      `SELECT id, tenant_id, name, description FROM dev.qup_roles
       WHERE tenant_id = $1 AND name = $2`,
      [tenantId, name],
    );
    return res.rows[0] ? rowToRole(res.rows[0]) : null;
  }

  async listByTenant(tenantId: string): Promise<RoleEntity[]> {
    const res = await this.pool.query(
      `SELECT id, tenant_id, name, description FROM dev.qup_roles
       WHERE tenant_id = $1 ORDER BY name`,
      [tenantId],
    );
    return res.rows.map(rowToRole);
  }

  async listAll(): Promise<RoleEntity[]> {
    const res = await this.pool.query(
      `SELECT id, tenant_id, name, description FROM dev.qup_roles
       ORDER BY tenant_id, name`,
    );
    return res.rows.map(rowToRole);
  }

  async update(roleId: string, name?: string | null, description?: string | null): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (name !== undefined && name !== null) { fields.push(`name = $${idx++}`); params.push(name); }
    if (description !== undefined && description !== null) { fields.push(`description = $${idx++}`); params.push(description); }
    if (fields.length === 0) return false;
    params.push(roleId);
    const res = await this.pool.query(
      `UPDATE dev.qup_roles SET ${fields.join(', ')} WHERE id = $${idx}`,
      params,
    );
    return res.rowCount! > 0;
  }

  async delete(roleId: string): Promise<boolean> {
    const res = await this.pool.query(`DELETE FROM dev.qup_roles WHERE id = $1`, [roleId]);
    return res.rowCount! > 0;
  }

  async assignUserRole(userId: string, roleId: string, tenantId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO dev.qup_user_roles (user_id, role_id, tenant_id)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [userId, roleId, tenantId],
    );
  }

  async removeUserRole(userId: string, roleId: string, tenantId: string): Promise<boolean> {
    const res = await this.pool.query(
      `DELETE FROM dev.qup_user_roles
       WHERE user_id = $1 AND role_id = $2 AND tenant_id = $3`,
      [userId, roleId, tenantId],
    );
    return res.rowCount! > 0;
  }

  async getRoleNamesForUser(userId: string, tenantId: string): Promise<string[]> {
    const res = await this.pool.query(
      `SELECT r.name
       FROM dev.qup_user_roles ur
       JOIN dev.qup_roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1 AND ur.tenant_id = $2`,
      [userId, tenantId],
    );
    return res.rows.map((r) => r.name);
  }

  async getRolesForUser(userId: string, tenantId: string): Promise<{ id: string; name: string; description: string | null }[]> {
    const res = await this.pool.query(
      `SELECT r.id, r.name, r.description
       FROM dev.qup_user_roles ur
       JOIN dev.qup_roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1 AND ur.tenant_id = $2`,
      [userId, tenantId],
    );
    return res.rows.map((r) => ({ id: r.id, name: r.name, description: r.description ?? null }));
  }
}
