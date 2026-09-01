import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  transform(value: string | number, currency: string = 'AUD'): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return `${currency} 0.00`;
    return `${currency} ${num.toFixed(2)}`;
  }
}
