import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountFacade } from '../account/account.facade';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { CartFacade } from '../../state/cart/cart.facade';
import { CheckoutFacade } from './checkout.facade';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MoneyPipe, EmptyStateComponent],
  template: `
    <section class="checkout-page">
      <div class="stepper-banner">
        @for (label of ['Cart', 'Shipping Address', 'Shipping Method', 'Review', 'Payment']; track label; let index = $index) {
          <span [class.active]="step() >= index + 1">{{ label }}</span>
        }
      </div>

      @if (cart.items().length === 0) {
        <app-empty-state title="Your cart is empty" message="Add products before checkout.">
          <a class="btn-primary mt-3" routerLink="/products">Browse products</a>
        </app-empty-state>
      } @else {
        <section class="two-column">
          <form class="surface checkout-form" [formGroup]="form" (ngSubmit)="placeOrder()">
            <h1>Checkout</h1>
            <label>
              Shipping address
              <select formControlName="shippingAddressId">
                <option value="">Select address</option>
                @for (address of account.addresses(); track address.id) {
                  <option [value]="address.id">{{ address.addressLine1 }}, {{ address.city }}</option>
                }
              </select>
            </label>
            <label>
              Billing address
              <select formControlName="billingAddressId">
                <option value="">Select address</option>
                @for (address of account.addresses(); track address.id) {
                  <option [value]="address.id">{{ address.addressLine1 }}, {{ address.city }}</option>
                }
              </select>
            </label>
            <label>
              Shipping method
              <select formControlName="shippingMethodId" (change)="refreshQuote()">
                <option value="">Select shipping</option>
                @for (method of checkout.shippingMethods(); track method.id) {
                  <option [value]="method.id">{{ method.name }} - {{ method.price | money:method.currency }} - {{ method.estimatedMinDays }}-{{ method.estimatedMaxDays }} days</option>
                }
              </select>
            </label>
            <div class="inline-actions">
              <a class="btn-secondary" routerLink="/account/addresses">Add address</a>
              <button class="btn-secondary" type="button" (click)="refreshQuote()">Refresh quote</button>
              <button class="btn-primary" type="submit" [disabled]="form.invalid || checkout.submitting()">Place mock-paid order</button>
            </div>
          </form>

          <aside class="surface totals">
            <h2>Review order</h2>
            @for (item of cart.items(); track item.id) {
              <div class="summary-item"><span>{{ item.quantity }} x {{ item.productName }}</span><strong>{{ item.lineTotal | money:cart.cart().currency }}</strong></div>
            }
            @if (checkout.quote(); as quote) {
              <dl>
                <div><dt>Subtotal</dt><dd>{{ quote.subtotal | money:quote.currency }}</dd></div>
                <div><dt>Discount</dt><dd>-{{ quote.discountTotal | money:quote.currency }}</dd></div>
                <div><dt>Shipping</dt><dd>{{ quote.shippingTotal | money:quote.currency }}</dd></div>
                <div><dt>Tax</dt><dd>{{ quote.taxTotal | money:quote.currency }}</dd></div>
                <div class="grand"><dt>Total</dt><dd>{{ quote.grandTotal | money:quote.currency }}</dd></div>
              </dl>
            } @else {
              <p class="muted">Select a shipping method to generate a backend quote.</p>
            }
          </aside>
        </section>
      }
    </section>
  `,
})
export class CheckoutPage implements OnInit {
  readonly cart = inject(CartFacade);
  readonly account = inject(AccountFacade);
  readonly checkout = inject(CheckoutFacade);
  private readonly router = inject(Router);
  readonly step = signal(1);

  readonly form = new FormGroup({
    shippingAddressId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    billingAddressId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    shippingMethodId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([this.cart.load(), this.account.load(), this.checkout.loadShippingMethods()]);
    const shipping = this.account.addresses().find((address) => address.isDefaultShipping) ?? this.account.addresses()[0];
    const billing = this.account.addresses().find((address) => address.isDefaultBilling) ?? shipping;
    this.form.patchValue({ shippingAddressId: shipping?.id ?? '', billingAddressId: billing?.id ?? '' });
  }

  async refreshQuote(): Promise<void> {
    const method = this.form.controls.shippingMethodId.value;
    this.step.set(method ? 4 : 2);
    await this.checkout.refreshQuote(method);
  }

  async placeOrder(): Promise<void> {
    if (this.form.invalid) return;
    const orderId = await this.checkout.checkout(this.form.getRawValue());
    if (orderId) await this.router.navigate(['/orders', orderId]);
  }
}
