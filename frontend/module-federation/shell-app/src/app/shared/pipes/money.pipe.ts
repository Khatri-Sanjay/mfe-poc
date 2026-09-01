import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'money',
  standalone: true,
})
export class MoneyPipe implements PipeTransform {
  transform(value: string | number | null | undefined, currency = 'AUD'): string {
    const amount = Number(value ?? 0);
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency,
    }).format(Number.isFinite(amount) ? amount : 0);
  }
}
