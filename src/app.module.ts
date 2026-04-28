import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { TenantModule } from './modules/User-management/tenant/tenant.module.js';
import { UserModule } from './modules/User-management/user/user.module.js';
import { RoleModule } from './modules/User-management/role/role.module.js';
import { PermissionModule } from './modules/User-management/permission/permission.module.js';
import { GroupModule } from './modules/User-management/group/group.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),  // loads .env, available everywhere
    DatabaseModule,
    RoleModule,
    UserModule,
    TenantModule,
    PermissionModule,
    GroupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

