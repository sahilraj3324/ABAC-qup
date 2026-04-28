import { Module } from '@nestjs/common';
import { PermissionRepository } from './permission.repository.interface.js';
import { PermissionRepositoryImpl } from './permission.repository.js';
import { PermissionService } from './permission.service.js';

@Module({
  providers: [
    PermissionService,
    { provide: PermissionRepository, useClass: PermissionRepositoryImpl },
  ],
  exports: [PermissionService, PermissionRepository],
})
export class PermissionModule {}
