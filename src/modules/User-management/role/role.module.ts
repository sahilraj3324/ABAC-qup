import { Module } from '@nestjs/common';
import { RoleRepository } from './role.repository.interface.js';
import { RoleRepositoryImpl } from './role.repository.js';
import { RoleService } from './role.service.js';

@Module({
  providers: [
    RoleService,
    { provide: RoleRepository, useClass: RoleRepositoryImpl },
  ],
  exports: [RoleService, RoleRepository],
})
export class RoleModule {}
