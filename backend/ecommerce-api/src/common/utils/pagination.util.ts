import { PaginationMetaDto } from '../dto/api-response.dto';

export const createPaginationMeta = (page: number, limit: number, total: number): PaginationMetaDto => {
	const totalPages = Math.ceil(total / limit);

	return {
		page,
		limit,
		total,
		totalPages,
		hasNextPage: page < totalPages,
		hasPreviousPage: page > 1
	};
};
