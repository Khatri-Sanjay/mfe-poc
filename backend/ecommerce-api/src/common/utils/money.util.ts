export const toCents = (value: string): number => {
	const [units, decimals = ''] = value.split('.');
	return Number(units) * 100 + Number(decimals.padEnd(2, '0').slice(0, 2));
};

export const centsToMoney = (value: number): string => {
	const sign = value < 0 ? '-' : '';
	const absolute = Math.abs(value);
	return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, '0')}`;
};

export const multiplyMoney = (unitPrice: string, quantity: number): string => centsToMoney(toCents(unitPrice) * quantity);
