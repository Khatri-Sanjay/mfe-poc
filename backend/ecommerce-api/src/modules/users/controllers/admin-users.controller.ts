import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { ApiPaginatedWrappedResponse, ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import { AdminUserQueryDto } from '../dto/admin-user-query.dto';
import { CreateAdminUserDto } from '../dto/create-admin-user.dto';
import { UpdateAdminUserDto } from '../dto/update-admin-user.dto';
import { UpdateUserRolesDto } from '../dto/update-user-roles.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UsersService } from '../services/users.service';

class UserIdParamDto {
	@IsUUID()
	id!: string;
}

@ApiTags('Admin Users')
@ApiBearerAuth('bearer')
@RequirePermissions('user.read')
@Controller('admin/users')
export class AdminUsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get()
	@ResponseMessage('Users retrieved successfully')
	@ApiOperation({
		summary: 'List users',
		description: 'Lists users for administration with pagination, search, and status filtering. Requires `user.read`.'
	})
	@ApiPaginatedWrappedResponse(UserResponseDto, 'Paginated admin user response')
	@ApiStandardErrors()
	listUsers(@Query() query: AdminUserQueryDto) {
		return this.usersService.listAdminUsers(query);
	}

	@Post()
	@RequirePermissions('user.manage')
	@ResponseMessage('User created successfully')
	@ApiOperation({
		summary: 'Create user',
		description:
			'Creates a user from the admin panel with an initial password, status, email verification flag, and roles. Requires `user.manage`.'
	})
	@ApiBody({ type: CreateAdminUserDto })
	@ApiWrappedResponse(UserResponseDto, 'Created admin user response')
	@ApiStandardErrors()
	createUser(@Body() dto: CreateAdminUserDto) {
		return this.usersService.createAdminUser(dto);
	}

	@Get(':id')
	@ResponseMessage('User retrieved successfully')
	@ApiOperation({
		summary: 'Get user by id',
		description: 'Returns a user for administration. Requires `user.read`.'
	})
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiWrappedResponse(UserResponseDto, 'Admin user detail response')
	@ApiStandardErrors()
	getUser(@Param() params: UserIdParamDto) {
		return this.usersService.getCurrentUser(params.id);
	}

	@Patch(':id')
	@RequirePermissions('user.manage')
	@ResponseMessage('User updated successfully')
	@ApiOperation({
		summary: 'Update user',
		description:
			'Updates admin-managed user profile fields, status, email verification flag, and roles in one request. Requires `user.manage`.'
	})
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiBody({ type: UpdateAdminUserDto })
	@ApiWrappedResponse(UserResponseDto, 'Updated admin user response')
	@ApiStandardErrors()
	updateUser(@Param() params: UserIdParamDto, @Body() dto: UpdateAdminUserDto) {
		return this.usersService.updateAdminUser(params.id, dto);
	}

	@Patch(':id/status')
	@RequirePermissions('user.manage')
	@ResponseMessage('User status updated successfully')
	@ApiOperation({
		summary: 'Update user status',
		description: 'Updates a user status. Requires `user.manage`.'
	})
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiBody({ type: UpdateUserStatusDto })
	@ApiWrappedResponse(UserResponseDto, 'Updated user response')
	@ApiStandardErrors()
	updateStatus(@Param() params: UserIdParamDto, @Body() dto: UpdateUserStatusDto) {
		return this.usersService.updateStatus(params.id, dto.status);
	}

	@Patch(':id/roles')
	@RequirePermissions('user.manage')
	@ResponseMessage('User roles updated successfully')
	@ApiOperation({
		summary: 'Update user roles',
		description: 'Replaces user roles. Requires `user.manage`.'
	})
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiBody({ type: UpdateUserRolesDto })
	@ApiWrappedResponse(UserResponseDto, 'Updated user roles response')
	@ApiStandardErrors()
	updateRoles(@Param() params: UserIdParamDto, @Body() dto: UpdateUserRolesDto) {
		return this.usersService.updateRoles(params.id, dto.roles);
	}
}
