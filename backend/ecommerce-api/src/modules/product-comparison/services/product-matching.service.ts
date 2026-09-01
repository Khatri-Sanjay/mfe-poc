import { Injectable } from '@nestjs/common';
import type { ExternalProductOffer, ProductSourceSearchContext } from '../interfaces/product-source.interface';

const normalize = (value?: string): string => (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const hasWord = (value: string, word: string): boolean => new RegExp(`(^|\\s)${word}(\\s|$)`).test(value);

@Injectable()
export class ProductMatchingService {
	isMatch(context: ProductSourceSearchContext, offer: ExternalProductOffer): boolean {
		if (context.barcode && offer.barcode) {
			return normalize(context.barcode) === normalize(offer.barcode);
		}

		if (context.sku && offer.sku && normalize(context.sku) === normalize(offer.sku)) {
			return true;
		}

		const targetName = normalize([context.brand, context.name, context.model, context.variant].filter(Boolean).join(' '));
		const offerText = normalize([offer.brand, offer.title, offer.model, offer.variant].filter(Boolean).join(' '));

		if (context.brand && offer.brand && normalize(context.brand) !== normalize(offer.brand)) {
			return false;
		}

		if (!this.matchesStorage(context.storage, offer.storage, offerText)) {
			return false;
		}

		if (!this.matchesColor(context.color, offer.color, offerText)) {
			return false;
		}

		if (!this.matchesVariantFamily(targetName, offerText)) {
			return false;
		}

		return this.requiredProductTokens(context.name).every((token) => offerText.includes(token));
	}

	private matchesStorage(storage: string | undefined, offerStorage: string | undefined, offerText: string): boolean {
		if (!storage) return true;
		const targetStorage = normalize(storage);
		return normalize(offerStorage) === targetStorage || offerText.includes(targetStorage);
	}

	private matchesColor(color: string | undefined, offerColor: string | undefined, offerText: string): boolean {
		if (!color) return true;
		const targetColor = normalize(color);
		return normalize(offerColor) === targetColor || offerText.includes(targetColor);
	}

	private matchesVariantFamily(targetName: string, offerText: string): boolean {
		for (const marker of ['pro', 'max', 'plus', 'ultra']) {
			if (hasWord(offerText, marker) && !hasWord(targetName, marker)) {
				return false;
			}
		}
		return true;
	}

	private requiredProductTokens(name: string): string[] {
		return normalize(name)
			.split(' ')
			.filter((token) => token.length > 1)
			.filter((token) => !['with', 'and', 'the', 'for'].includes(token));
	}
}
