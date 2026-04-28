import { TenantEntity } from './tenant.entity.js';

export abstract class TenantRepository {
  abstract create(name: string): Promise<TenantEntity>;
  abstract get(tenantId: string): Promise<TenantEntity | null>;
  abstract listAll(): Promise<TenantEntity[]>;
  abstract update(tenantId: string, name: string | null, isActive: boolean | null): Promise<TenantEntity | null>;
  abstract delete(tenantId: string): Promise<boolean>;
  abstract existsByName(name: string): Promise<boolean>;
}
