import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
	@ApiProperty()
	id!: string;

	@ApiProperty({ example: 'Phones' })
	name!: string;

	@ApiProperty({ example: 'phones' })
	slug!: string;

	@ApiProperty({ nullable: true })
	description!: string | null;

	@ApiProperty({ nullable: true })
	parentId!: string | null;

	@ApiProperty({ nullable: true })
	imageUrl!: string | null;

	@ApiProperty()
	isActive!: boolean;

	@ApiProperty()
	sortOrder!: number;
}
