import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationMetaDto {
	@ApiProperty({ example: 1 })
	page!: number;

	@ApiProperty({ example: 20 })
	limit!: number;

	@ApiProperty({ example: 126 })
	total!: number;

	@ApiProperty({ example: 7 })
	totalPages!: number;

	@ApiProperty({ example: true })
	hasNextPage!: boolean;

	@ApiProperty({ example: false })
	hasPreviousPage!: boolean;
}

export class ApiResponseDto<TData> {
	@ApiProperty({ example: true })
	success!: true;

	@ApiProperty({ example: 200 })
	statusCode!: number;

	@ApiProperty({ example: 'Request completed successfully' })
	message!: string;

	@ApiProperty()
	data!: TData;

	@ApiPropertyOptional({ type: PaginationMetaDto })
	meta?: PaginationMetaDto;

	@ApiProperty({ example: '2026-08-25T10:00:00.000Z' })
	timestamp!: string;

	@ApiProperty({ example: '/api/v1/products' })
	path!: string;

	@ApiProperty({ example: '9d716e74-8421-4a9a-a80f-489a7be127d8' })
	requestId!: string;
}
