import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { UserStatus } from '../enums/user-status.enum';

export class AdminUserQueryDto extends PaginationQueryDto {
	@ApiPropertyOptional({ enum: UserStatus })
	@IsEnum(UserStatus)
	@IsOptional()
	status?: UserStatus;
}
