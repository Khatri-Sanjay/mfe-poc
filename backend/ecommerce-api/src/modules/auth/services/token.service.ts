import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';
import ms, { StringValue } from 'ms';

@Injectable()
export class TokenService {
	generateOpaqueToken(): string {
		return randomBytes(48).toString('base64url');
	}

	hashToken(token: string): string {
		return createHash('sha256').update(token).digest('hex');
	}

	addDuration(value: string): Date {
		return new Date(Date.now() + this.durationToMs(value));
	}

	durationToSeconds(value: string): number {
		return Math.floor(this.durationToMs(value) / 1000);
	}

	private durationToMs(value: string): number {
		const parsed = ms(value as StringValue);

		if (typeof parsed !== 'number') {
			throw new Error(`Invalid duration value: ${value}`);
		}

		return parsed;
	}
}
