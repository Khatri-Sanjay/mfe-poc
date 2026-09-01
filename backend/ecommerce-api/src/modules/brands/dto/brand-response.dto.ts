import { ApiProperty } from '@nestjs/swagger';

export class BrandResponseDto {
	@ApiProperty()
	id!: string;

	@ApiProperty({ example: 'Apple' })
	name!: string;

	@ApiProperty({ example: 'apple' })
	slug!: string;

	@ApiProperty({ nullable: true })
	description!: string | null;

	@ApiProperty({ nullable: true })
	logoUrl!: string | null;

	@ApiProperty({ nullable: true })
	websiteUrl!: string | null;

	@ApiProperty()
	isActive!: boolean;
}
