import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
	@ApiProperty({ example: 'reset-token' })
	@IsString()
	@MinLength(32)
	token!: string;

	@ApiProperty({ example: 'New-password-123' })
	@IsString()
	@MinLength(12)
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
		message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
	})
	newPassword!: string;
}
