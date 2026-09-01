import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../enums/user-status.enum';

export class UserResponseDto {
	@ApiProperty({ example: '0f99e4f2-c093-4034-a11b-bd3d7d67b254' })
	id!: string;

	@ApiProperty({ example: 'John' })
	firstName!: string;

	@ApiProperty({ example: 'Smith' })
	lastName!: string;

	@ApiProperty({ example: 'john@example.com' })
	email!: string;

	@ApiProperty({ example: '+61400000000', nullable: true })
	phone!: string | null;

	@ApiProperty({ enum: UserStatus, example: UserStatus.Active })
	status!: UserStatus;

	@ApiProperty({ example: true })
	emailVerified!: boolean;

	@ApiProperty({ example: ['CUSTOMER'] })
	roles!: string[];

	@ApiProperty({ example: ['product.read'] })
	permissions!: string[];

	@ApiProperty({ example: '2026-08-25T10:00:00.000Z' })
	createdAt!: string;
}
