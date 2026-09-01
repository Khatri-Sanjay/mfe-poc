import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesModule } from '../roles/roles.module';
import { AdminUsersController } from './controllers/admin-users.controller';
import { UsersController } from './controllers/users.controller';
import { User } from './entities/user.entity';
import { UsersService } from './services/users.service';

@Module({
	imports: [TypeOrmModule.forFeature([User]), RolesModule],
	controllers: [UsersController, AdminUsersController],
	providers: [UsersService],
	exports: [UsersService, TypeOrmModule]
})
export class UsersModule {}
