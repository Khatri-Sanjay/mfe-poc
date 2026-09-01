import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString, MaxLength } from 'class-validator';

export class UpdateUserRolesDto {
	@ApiProperty({ example: ['CUSTOMER', 'ADMIN'] })
	@IsArray()
	@ArrayNotEmpty()
	@IsString({ each: true })
	@MaxLength(80, { each: true })
	roles!: string[];
}
