import { applyDecorators, Type } from '@nestjs/common';
import {
	ApiExtraModels,
	ApiOkResponse,
	ApiCreatedResponse,
	ApiBadRequestResponse,
	ApiUnauthorizedResponse,
	ApiForbiddenResponse,
	ApiNotFoundResponse,
	ApiConflictResponse,
	getSchemaPath
} from '@nestjs/swagger';
import { ApiResponseDto, PaginationMetaDto } from '../dto/api-response.dto';
import { ApiErrorResponseDto } from '../dto/api-error-response.dto';

export const ApiWrappedResponse = <TModel extends Type<unknown>>(model: TModel, description: string) =>
	applyDecorators(
		ApiExtraModels(ApiResponseDto, model),
		ApiOkResponse({
			description,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(ApiResponseDto) },
					{
						properties: {
							data: { $ref: getSchemaPath(model) }
						}
					}
				]
			}
		})
	);

export const ApiCreatedWrappedResponse = <TModel extends Type<unknown>>(model: TModel, description: string) =>
	applyDecorators(
		ApiExtraModels(ApiResponseDto, model),
		ApiCreatedResponse({
			description,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(ApiResponseDto) },
					{
						properties: {
							data: { $ref: getSchemaPath(model) }
						}
					}
				]
			}
		})
	);

export const ApiPaginatedWrappedResponse = <TModel extends Type<unknown>>(model: TModel, description: string) =>
	applyDecorators(
		ApiExtraModels(ApiResponseDto, PaginationMetaDto, model),
		ApiOkResponse({
			description,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(ApiResponseDto) },
					{
						properties: {
							data: {
								type: 'array',
								items: { $ref: getSchemaPath(model) }
							},
							meta: { $ref: getSchemaPath(PaginationMetaDto) }
						}
					}
				]
			}
		})
	);

export const ApiStandardErrors = () =>
	applyDecorators(
		ApiExtraModels(ApiErrorResponseDto),
		ApiBadRequestResponse({
			description: 'Validation error',
			type: ApiErrorResponseDto
		}),
		ApiUnauthorizedResponse({
			description: 'Authentication is required or invalid',
			type: ApiErrorResponseDto
		}),
		ApiForbiddenResponse({
			description: 'Authenticated user does not have access',
			type: ApiErrorResponseDto
		}),
		ApiNotFoundResponse({
			description: 'Resource was not found',
			type: ApiErrorResponseDto
		}),
		ApiConflictResponse({
			description: 'Request conflicts with existing state',
			type: ApiErrorResponseDto
		})
	);
