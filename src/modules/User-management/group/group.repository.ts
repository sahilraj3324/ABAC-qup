import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../../database/database.module.js';
import { GroupRepository } from './group.repository.interface.js';
import { GroupEntity } from './group.entity.js';

function rowToGroup(r: any): GroupEntity {
  return { id: r.id, tenant_id: r.tenant_id, name: r.name, description: r.description ?? null };
}

@Injectable()
export class GroupRepositoryImpl extends GroupRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {
    super();
  }

  async create(tenantId: string, name: string, description: string | null): Promise<GroupEntity> {
    const res = await this.pool.query(
      `INSERT INTO dev.qup_groups (tenant_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, tenant_id, name, description`,
      [tenantId, name, description],
    );
    return rowToGroup(res.rows[0]);
  }

  async get(groupId: string): Promise<GroupEntity | null> {
    const res = await this.pool.query(
      `SELECT id, tenant_id, name, description FROM dev.qup_groups WHERE id = $1`,
      [groupId],
    );
    return res.rows[0] ? rowToGroup(res.rows[0]) : null;
  }

  async listByTenant(tenantId: string): Promise<GroupEntity[]> {
    const res = await this.pool.query(
      `SELECT id, tenant_id, name, description FROM dev.qup_groups
       WHERE tenant_id = $1 ORDER BY name`,
      [tenantId],
    );
    return res.rows.map(rowToGroup);
  }

  async update(groupId: string, name: string | null, description: string | null): Promise<GroupEntity | null> {
    const res = await this.pool.query(
      `UPDATE dev.qup_groups
       SET name        = COALESCE($1, name),
           description = COALESCE($2, description)
       WHERE id = $3
       RETURNING id, tenant_id, name, description`,
      [name, description, groupId],
    );
    return res.rows[0] ? rowToGroup(res.rows[0]) : null;
  }

  async delete(groupId: string): Promise<boolean> {
    const res = await this.pool.query(`DELETE FROM dev.qup_groups WHERE id = $1`, [groupId]);
    return res.rowCount! > 0;
  }

  async addUser(userId: string, groupId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO dev.qup_user_groups (user_id, group_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, groupId],
    );
  }

  async removeUser(userId: string, groupId: string): Promise<boolean> {
    const res = await this.pool.query(
      `DELETE FROM dev.qup_user_groups WHERE user_id = $1 AND group_id = $2`,
      [userId, groupId],
    );
    return res.rowCount! > 0;
  }

  async groupsForUser(userId: string, tenantId: string): Promise<GroupEntity[]> {
    const res = await this.pool.query(
      `SELECT g.id, g.tenant_id, g.name, g.description
       FROM dev.qup_user_groups ug
       JOIN dev.qup_groups g ON g.id = ug.group_id
       WHERE ug.user_id = $1 AND g.tenant_id = $2`,
      [userId, tenantId],
    );
    return res.rows.map(rowToGroup);
  }

  async usersForGroup(groupId: string): Promise<{ id: string; email: string; first_name: string; last_name: string; is_active: boolean; created_at: string | null; updated_at: string | null }[]> {
    const res = await this.pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, u.created_at, u.updated_at
       FROM dev.qup_user_groups ug
       JOIN dev.qup_users u ON u.id = ug.user_id
       WHERE ug.group_id = $1
       ORDER BY u.first_name, u.last_name`,
      [groupId],
    );
    return res.rows.map((r) => ({
      id: r.id,
      email: r.email,
      first_name: r.first_name,
      last_name: r.last_name,
      is_active: r.is_active,
      created_at: r.created_at ? (r.created_at as Date).toISOString() : null,
      updated_at: r.updated_at ? (r.updated_at as Date).toISOString() : null,
    }));
  }
}
