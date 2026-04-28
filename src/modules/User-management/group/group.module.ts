import { Module } from '@nestjs/common';
import { GroupRepository } from './group.repository.interface.js';
import { GroupRepositoryImpl } from './group.repository.js';
import { GroupService } from './group.service.js';

@Module({
  providers: [
    GroupService,
    { provide: GroupRepository, useClass: GroupRepositoryImpl },
  ],
  exports: [GroupService, GroupRepository],
})
export class GroupModule {}
