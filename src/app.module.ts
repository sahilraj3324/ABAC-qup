import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { TenantModule } from './modules/User-management/tenant/tenant.module.js';
import { UserModule } from './modules/User-management/user/user.module.js';
import { RoleModule } from './modules/User-management/role/role.module.js';
import { PermissionModule } from './modules/User-management/permission/permission.module.js';
import { GroupModule } from './modules/User-management/group/group.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { AuthorizationModule } from './modules/authorization/authorization.module.js';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RoleModule,
    UserModule,
    TenantModule,
    PermissionModule,
    GroupModule,
    AuthModule,
    AuthorizationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // ─── Global JWT Guard ────────────────────────────────────────────────────
    // Every route requires a valid Bearer token by default.
    // Decorate a controller/handler with @Public() to opt out.
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}


