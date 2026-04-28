import { Module } from '@nestjs/common';
import { RoleModule } from '../role/role.module.js';
import { UserRepository } from './user.repository.interface.js';
import { UserRepositoryImpl } from './user.repository.js';
import { UserService } from './user.service.js';

@Module({
  imports: [RoleModule],
  providers: [
    UserService,
    { provide: UserRepository, useClass: UserRepositoryImpl },
  ],
  exports: [UserService, UserRepository],
})
export class UserModule { }
