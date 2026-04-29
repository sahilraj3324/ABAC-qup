import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../../database/database.module.js';
import { PermissionRepository } from './permission.repository.interface.js';
import { PermissionEntity } from './permission.entity.js';

function rowToPerm(r: any): PermissionEntity {
  return { id: r.id, code: r.code, name: r.name, description: r.description ?? null };
}

@Injectable()
export class PermissionRepositoryImpl extends PermissionRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {
    super();
  }

  async ensure(code: string, name: string, desc: string | null): Promise<PermissionEntity> {
    const sel = await this.pool.query(
      `SELECT id, code, name, description FROM dev.qup_permission_types WHERE code = $1`,
      [code],
    );
    if (sel.rows[0]) return rowToPerm(sel.rows[0]);
    const ins = await this.pool.query(
      `INSERT INTO dev.qup_permission_types (code, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, code, name, description`,
      [code, name, desc],
    );
    return rowToPerm(ins.rows[0]);
  }

  async get(permissionId: string): Promise<PermissionEntity | null> {
    const res = await this.pool.query(
      `SELECT id, code, name, description FROM dev.qup_permission_types WHERE id = $1`,
      [permissionId],
    );
    return res.rows[0] ? rowToPerm(res.rows[0]) : null;
  }

  async getByCode(code: string): Promise<PermissionEntity | null> {
    const res = await this.pool.query(
      `SELECT id, code, name, description FROM dev.qup_permission_types WHERE code = $1`,
      [code],
    );
    return res.rows[0] ? rowToPerm(res.rows[0]) : null;
  }

  async listAll(): Promise<PermissionEntity[]> {
    const res = await this.pool.query(
      `SELECT id, code, name, description FROM dev.qup_permission_types ORDER BY code`,
    );
    return res.rows.map(rowToPerm);
  }

  async update(permissionId: string, code?: string | null, name?: string | null, description?: string | null): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (code !== undefined && code !== null) { fields.push(`code = $${idx++}`); params.push(code); }
    if (name !== undefined && name !== null) { fields.push(`name = $${idx++}`); params.push(name); }
    if (description !== undefined && description !== null) { fields.push(`description = $${idx++}`); params.push(description); }
    if (fields.length === 0) return false;
    params.push(permissionId);
    const res = await this.pool.query(
      `UPDATE dev.qup_permission_types SET ${fields.join(', ')} WHERE id = $${idx}`,
      params,
    );
    return res.rowCount! > 0;
  }

  async delete(permissionId: string): Promise<boolean> {
    const res = await this.pool.query(
      `DELETE FROM dev.qup_permission_types WHERE id = $1`,
      [permissionId],
    );
    return res.rowCount! > 0;
  }

  async grantToRole(roleId: string, permissionId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO dev.qup_role_permissions (role_id, permission_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [roleId, permissionId],
    );
  }

  async revokeFromRole(roleId: string, permissionId: string): Promise<boolean> {
    const res = await this.pool.query(
      `DELETE FROM dev.qup_role_permissions WHERE role_id = $1 AND permission_id = $2`,
      [roleId, permissionId],
    );
    return res.rowCount! > 0;
  }

  async getForRole(roleId: string): Promise<PermissionEntity[]> {
    const res = await this.pool.query(
      `SELECT pt.id, pt.code, pt.name, pt.description
       FROM dev.qup_role_permissions rp
       JOIN dev.qup_permission_types pt ON pt.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY pt.code`,
      [roleId],
    );
    return res.rows.map(rowToPerm);
  }

  async getEffectiveCodes(userId: string, tenantId: string): Promise<Set<string>> {
    const res = await this.pool.query(
      `SELECT DISTINCT pt.code
       FROM dev.qup_user_roles ur
       JOIN dev.qup_role_permissions rp ON rp.role_id = ur.role_id
       JOIN dev.qup_permission_types pt ON pt.id = rp.permission_id
       WHERE ur.user_id = $1 AND ur.tenant_id = $2`,
      [userId, tenantId],
    );
    return new Set(res.rows.map((r) => r.code));
  }
}
