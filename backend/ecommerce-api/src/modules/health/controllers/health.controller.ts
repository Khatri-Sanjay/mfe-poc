import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicHealthDto } from '../dto/public-health.dto';
import { HealthService } from '../services/health.service';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
	constructor(private readonly healthService: HealthService) {}

	@Get()
	@ResponseMessage('Service health retrieved successfully')
	@ApiOperation({
		summary: 'Get service health',
		description: 'Returns liveness and readiness information without exposing secrets or host internals.'
	})
	@ApiWrappedResponse(PublicHealthDto, 'Service health response')
	@ApiStandardErrors()
	getHealth(): Promise<PublicHealthDto> {
		return this.healthService.getHealth();
	}

	@Get('live')
	@ResponseMessage('Liveness retrieved successfully')
	@ApiOperation({
		summary: 'Get liveness',
		description: 'Confirms the HTTP process is alive.'
	})
	@ApiWrappedResponse(PublicHealthDto, 'Service liveness response')
	@ApiStandardErrors()
	getLiveness(): PublicHealthDto {
		return this.healthService.getLiveness();
	}

	@Get('ready')
	@ResponseMessage('Readiness retrieved successfully')
	@ApiOperation({
		summary: 'Get readiness',
		description: 'Confirms dependencies required to serve traffic are ready.'
	})
	@ApiWrappedResponse(PublicHealthDto, 'Service readiness response')
	@ApiStandardErrors()
	getReadiness(): Promise<PublicHealthDto> {
		return this.healthService.getReadiness();
	}
}
