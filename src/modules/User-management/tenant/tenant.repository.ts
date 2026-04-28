import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../../database/database.module.js';
import { TenantRepository } from './tenant.repository.interface.js';
import { TenantEntity } from './tenant.entity.js';

@Injectable()
export class TenantRepositoryImpl extends TenantRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {
    super();
  }

  async existsByName(name: string): Promise<boolean> {
    const res = await this.pool.query(
      `SELECT 1 FROM dev.qup_tenants WHERE name = $1 LIMIT 1`,
      [name],
    );
    return res.rowCount! > 0;
  }

  async create(name: string): Promise<TenantEntity> {
    const res = await this.pool.query(
      `INSERT INTO dev.qup_tenants (name)
       VALUES ($1)
       RETURNING id, name, is_active, created_at, updated_at`,
      [name],
    );
    return res.rows[0] as TenantEntity;
  }

  async get(tenantId: string): Promise<TenantEntity | null> {
    const res = await this.pool.query(
      `SELECT id, name, is_active, created_at, updated_at
       FROM dev.qup_tenants WHERE id = $1`,
      [tenantId],
    );
    return res.rows[0] ?? null;
  }

  async listAll(): Promise<TenantEntity[]> {
    const res = await this.pool.query(
      `SELECT id, name, is_active, created_at, updated_at
       FROM dev.qup_tenants ORDER BY created_at DESC`,
    );
    return res.rows;
  }

  async update(tenantId: string, name: string | null, isActive: boolean | null): Promise<TenantEntity | null> {
    const res = await this.pool.query(
      `UPDATE dev.qup_tenants
       SET name      = COALESCE($1, name),
           is_active = COALESCE($2, is_active),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, is_active, created_at, updated_at`,
      [name, isActive, tenantId],
    );
    return res.rows[0] ?? null;
  }

  async delete(tenantId: string): Promise<boolean> {
    const res = await this.pool.query(
      `DELETE FROM dev.qup_tenants WHERE id = $1`,
      [tenantId],
    );
    return res.rowCount! > 0;
  }
}
