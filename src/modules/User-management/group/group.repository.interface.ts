import { GroupEntity } from './group.entity.js';

export abstract class GroupRepository {
  abstract create(tenantId: string, name: string, description: string | null): Promise<GroupEntity>;
  abstract get(groupId: string): Promise<GroupEntity | null>;
  abstract listByTenant(tenantId: string): Promise<GroupEntity[]>;
  abstract update(groupId: string, name: string | null, description: string | null): Promise<GroupEntity | null>;
  abstract delete(groupId: string): Promise<boolean>;
  abstract addUser(userId: string, groupId: string): Promise<void>;
  abstract removeUser(userId: string, groupId: string): Promise<boolean>;
  abstract groupsForUser(userId: string, tenantId: string): Promise<GroupEntity[]>;
  abstract usersForGroup(groupId: string): Promise<{ id: string; email: string; first_name: string; last_name: string; is_active: boolean; created_at: string | null; updated_at: string | null }[]>;
}
