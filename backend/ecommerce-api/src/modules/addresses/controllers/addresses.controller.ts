import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { IdParamDto } from '../../../common/dto/id-param.dto';
import { ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { AddressResponseDto, CreateAddressDto, UpdateAddressDto } from '../dto/address.dto';
import { AddressesService } from '../services/addresses.service';

@ApiTags('Addresses')
@ApiBearerAuth('bearer')
@Controller('users/me/addresses')
export class AddressesController {
	constructor(private readonly addressesService: AddressesService) {}

	@Get()
	@ResponseMessage('Addresses retrieved successfully')
	@ApiOperation({ summary: 'List current user addresses' })
	@ApiWrappedResponse(AddressResponseDto, 'Address list response')
	@ApiStandardErrors()
	list(@CurrentUser() user: AuthenticatedUser) {
		return this.addressesService.list(user.id);
	}

	@Post()
	@ResponseMessage('Address created successfully')
	@ApiBody({ type: CreateAddressDto })
	@ApiWrappedResponse(AddressResponseDto, 'Created address response')
	@ApiStandardErrors()
	create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAddressDto) {
		return this.addressesService.create(user.id, dto);
	}

	@Get(':id')
	@ResponseMessage('Address retrieved successfully')
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiWrappedResponse(AddressResponseDto, 'Address response')
	@ApiStandardErrors()
	get(@CurrentUser() user: AuthenticatedUser, @Param() params: IdParamDto) {
		return this.addressesService.get(user.id, params.id);
	}

	@Patch(':id')
	@ResponseMessage('Address updated successfully')
	@ApiBody({ type: UpdateAddressDto })
	@ApiWrappedResponse(AddressResponseDto, 'Updated address response')
	@ApiStandardErrors()
	update(@CurrentUser() user: AuthenticatedUser, @Param() params: IdParamDto, @Body() dto: UpdateAddressDto) {
		return this.addressesService.update(user.id, params.id, dto);
	}

	@Delete(':id')
	@ResponseMessage('Address deleted successfully')
	@ApiWrappedResponse(Object, 'Deleted address response')
	@ApiStandardErrors()
	delete(@CurrentUser() user: AuthenticatedUser, @Param() params: IdParamDto) {
		return this.addressesService.delete(user.id, params.id);
	}
}
