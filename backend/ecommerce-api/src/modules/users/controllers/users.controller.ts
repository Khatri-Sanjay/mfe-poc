import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { MessageResponseDto } from '../../auth/dto/message-response.dto';
import { UpdateCurrentUserDto } from '../dto/update-current-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UsersService } from '../services/users.service';

@ApiTags('Users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get('me')
	@ResponseMessage('Current user retrieved successfully')
	@ApiOperation({
		summary: 'Get current user profile',
		description: 'Returns the authenticated customer profile.'
	})
	@ApiWrappedResponse(UserResponseDto, 'Current user profile response')
	@ApiStandardErrors()
	getMe(@CurrentUser() user: AuthenticatedUser) {
		return this.usersService.getCurrentUser(user.id);
	}

	@Patch('me')
	@ResponseMessage('Current user updated successfully')
	@ApiOperation({
		summary: 'Update current user profile',
		description: 'Updates editable profile fields for the authenticated user.'
	})
	@ApiBody({ type: UpdateCurrentUserDto })
	@ApiWrappedResponse(UserResponseDto, 'Updated current user response')
	@ApiStandardErrors()
	updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateCurrentUserDto) {
		return this.usersService.updateCurrentUser(user.id, dto);
	}

	@Patch('me/password')
	@ResponseMessage('Password changed successfully')
	@ApiOperation({
		summary: 'Change current user password',
		description: 'Changes the authenticated user password after validating the current password.'
	})
	@ApiBody({ type: ChangePasswordDto })
	@ApiWrappedResponse(MessageResponseDto, 'Password change response')
	@ApiStandardErrors()
	changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
		return this.usersService.changePassword(user.id, dto);
	}
}
