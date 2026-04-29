import { Module } from '@nestjs/common';
import { PermissionModule } from '../User-management/permission/permission.module.js';
import { UserModule } from '../User-management/user/user.module.js';
import { PermissionResolverService } from './permission-resolver.service.js';
import { AbacPolicyService } from './abac-policy.service.js';
import { AuthorizationService } from './authorization.service.js';
import { AuthorizationController } from './authorization.controller.js';

@Module({
  imports: [
    PermissionModule,  // provides PermissionRepository
    UserModule,        // provides UserRepository
  ],
  controllers: [AuthorizationController],
  providers: [
    PermissionResolverService,
    AbacPolicyService,
    AuthorizationService,
  ],
  exports: [AuthorizationService],  // export so guards in other modules can inject it
})
export class AuthorizationModule {}
