import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserStatus } from '../enums/user-status.enum';

export class UpdateUserStatusDto {
	@ApiProperty({ enum: UserStatus, example: UserStatus.Active })
	@IsEnum(UserStatus)
	status!: UserStatus;
}
