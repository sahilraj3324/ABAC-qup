import { UserEntity } from './user.entity.js';

export abstract class UserRepository {
  abstract createLocal(email: string, passwordHash: string, first: string, last: string): Promise<UserEntity>;
  abstract get(userId: string): Promise<UserEntity | null>;
  abstract getByEmail(email: string): Promise<UserEntity | null>;
  abstract listByTenant(tenantId: string): Promise<UserEntity[]>;
  abstract listAll(): Promise<UserEntity[]>;
  abstract update(userId: string, first: string | null, last: string | null, isActive: boolean | null): Promise<UserEntity | null>;
  abstract delete(userId: string): Promise<boolean>;
  abstract addMembership(userId: string, tenantId: string): Promise<void>;
  abstract isMemberOfTenant(userId: string, tenantId: string): Promise<boolean>;
  abstract getPasswordHash(email: string): Promise<string | null>;
  abstract updatePassword(userId: string, newPasswordHash: string): Promise<boolean>;
  abstract getUserTenants(userId: string): Promise<string[]>;
  abstract getMfaData(userId: string): Promise<[boolean, string | null, string[] | null]>;
  abstract updateMfa(userId: string, enabled: boolean, secret: string | null, backupCodes: string[] | null): Promise<boolean>;
}
