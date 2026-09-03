import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import {
	IframeAuthorizationRequestDto,
	IframeAuthorizationResponseDto,
	IframeTokenRequestDto,
	IframeTokenResponseDto
} from '../dto/iframe-auth.dto';
import { IframeAuthService } from '../services/iframe-auth.service';

@ApiTags('Iframe Auth')
@Controller('auth/iframe')
export class IframeAuthController {
	constructor(private readonly iframeAuthService: IframeAuthService) {}

	@Post('authorization')
	@ApiBearerAuth('bearer')
	@ResponseMessage('Iframe authorization code created successfully')
	@ApiOperation({
		summary: 'Create one-time iframe authorization code',
		description: 'Requires the parent application access token. The returned code is short-lived and bound to a PKCE challenge.'
	})
	@ApiBody({ type: IframeAuthorizationRequestDto })
	@ApiWrappedResponse(IframeAuthorizationResponseDto, 'Iframe authorization response')
	@ApiStandardErrors()
	createAuthorizationCode(@CurrentUser() user: AuthenticatedUser, @Body() dto: IframeAuthorizationRequestDto) {
		return this.iframeAuthService.createAuthorizationCode(user, dto);
	}

	@Public()
	@Post('token')
	@ResponseMessage('Iframe access token issued successfully')
	@ApiOperation({
		summary: 'Exchange one-time iframe authorization code',
		description: 'Exchanges a valid one-time code and PKCE verifier for a short-lived iframe access token.'
	})
	@ApiBody({ type: IframeTokenRequestDto })
	@ApiWrappedResponse(IframeTokenResponseDto, 'Iframe token response')
	@ApiStandardErrors()
	exchangeCode(@Body() dto: IframeTokenRequestDto) {
		return this.iframeAuthService.exchangeCode(dto);
	}
}
