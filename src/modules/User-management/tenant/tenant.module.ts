import { Module } from '@nestjs/common';
import { TenantRepository } from './tenant.repository.interface.js';
import { TenantRepositoryImpl } from './tenant.repository.js';
import { TenantService } from './tenant.service.js';
import { UserModule } from '../user/user.module.js';
import { RoleModule } from '../role/role.module.js';

@Module({
  imports: [UserModule, RoleModule],
  providers: [
    TenantService,
    { provide: TenantRepository, useClass: TenantRepositoryImpl },
  ],
  exports: [TenantService, TenantRepository],
})
export class TenantModule { }
