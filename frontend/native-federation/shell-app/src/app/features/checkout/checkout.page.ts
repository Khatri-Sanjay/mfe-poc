import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { CheckoutFacade, CheckoutStep } from "./checkout.facade";
import { CartFacade } from "../cart/cart.facade";
import { AuthFacade } from "../../state/auth/auth.facade";
import { MoneyPipe } from "../../shared/pipes/money.pipe";
import { Address, CreateAddressPayload } from "../../core/models/commerce.models";

@Component({
  selector: "app-checkout-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MoneyPipe],
  template: `
    <!-- Auth guard -->
    @if (!auth.isAuthenticated()) {
      <div class="checkout-auth-required">
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="bi bi-lock"></i>
          </div>
          <h2>Sign in to checkout</h2>
          <p>Please sign in to continue with your order.</p>
          <a routerLink="/auth/login" class="btn-primary">Sign in</a>
        </div>
      </div>
    } @else {
      <div class="checkout-container">
        <!-- Step indicator -->
        <div class="step-indicator">
          @for (s of facade.steps; track s; let i = $index) {
            <div
              class="step"
              [class.active]="facade.step() === s"
              [class.completed]="i < facade.stepIndex()"
              (click)="facade.goToStep(s)"
            >
              <div class="step-number">
                @if (i < facade.stepIndex()) {
                  <i class="bi bi-check-lg"></i>
                } @else {
                  {{ i + 1 }}
                }
              </div>
              <div class="step-label">{{ getStepLabel(s) }}</div>
            </div>
          }
        </div>

        <div class="checkout-layout">
          <!-- Main content -->
          <div class="checkout-main">
            <!-- Step 1: Address -->
            @if (facade.step() === "address") {
              <div class="checkout-section">
                <h2>Shipping Address</h2>

                @if (facade.addresses().length === 0) {
                  <div class="empty-addresses">
                    <p>You have no saved addresses.</p>
                    <button class="btn-secondary" (click)="showAddressForm.set(true)">
                      Add Address
                    </button>
                  </div>
                } @else {
                  <div class="address-list">
                    @for (addr of facade.addresses(); track addr.id) {
                      <div
                        class="address-card"
                        [class.selected]="facade.selectedShippingAddressId() === addr.id"
                        (click)="facade.selectShippingAddress(addr.id)"
                      >
                        <div class="address-radio">
                          <input
                            type="radio"
                            name="shippingAddress"
                            [checked]="facade.selectedShippingAddressId() === addr.id"
                            (change)="facade.selectShippingAddress(addr.id)"
                          />
                        </div>
                        <div class="address-info">
                          <div class="address-name">
                            {{ addr.firstName }} {{ addr.lastName }}
                          </div>
                          <div class="address-line">{{ addr.addressLine1 }}</div>
                          @if (addr.addressLine2) {
                            <div class="address-line">{{ addr.addressLine2 }}</div>
                          }
                          <div class="address-line">
                            {{ addr.city }}{{ addr.state ? ', ' + addr.state : '' }}
                            {{ addr.postalCode }}
                          </div>
                          <div class="address-line">{{ addr.countryCode }}</div>
                          @if (addr.phone) {
                            <div class="address-phone">{{ addr.phone }}</div>
                          }
                          @if (addr.isDefaultShipping) {
                            <span class="badge">Default</span>
                          }
                        </div>
                      </div>
                    }
                  </div>

                  <div class="same-billing">
                    <label class="checkbox-label">
                      <input
                        type="checkbox"
                        [checked]="sameAsShipping()"
                        (change)="toggleSameAsShipping()"
                      />
                      Billing address same as shipping
                    </label>
                  </div>

                  @if (!sameAsShipping()) {
                    <h3>Billing Address</h3>
                    <div class="address-list">
                      @for (addr of facade.addresses(); track addr.id) {
                        <div
                          class="address-card"
                          [class.selected]="facade.selectedBillingAddressId() === addr.id"
                          (click)="facade.selectBillingAddress(addr.id)"
                        >
                          <div class="address-radio">
                            <input
                              type="radio"
                              name="billingAddress"
                              [checked]="facade.selectedBillingAddressId() === addr.id"
                              (change)="facade.selectBillingAddress(addr.id)"
                            />
                          </div>
                          <div class="address-info">
                            <div class="address-name">
                              {{ addr.firstName }} {{ addr.lastName }}
                            </div>
                            <div class="address-line">{{ addr.addressLine1 }}</div>
                            <div class="address-line">
                              {{ addr.city }}, {{ addr.postalCode }}
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  }
                }

                <button class="btn-secondary" (click)="showAddressForm.set(true)">
                  <i class="bi bi-plus-lg"></i> Add New Address
                </button>

                <!-- Address form modal -->
                @if (showAddressForm()) {
                  <div class="modal-overlay" (click)="showAddressForm.set(false)">
                    <div class="modal-content" (click)="$event.stopPropagation()">
                      <h3>Add New Address</h3>
                      <form (submit)="submitAddress($event)">
                        <div class="form-row">
                          <div class="form-group">
                            <label>First Name</label>
                            <input
                              type="text"
                              name="firstName"
                              [(ngModel)]="addressForm.firstName"
                              required
                            />
                          </div>
                          <div class="form-group">
                            <label>Last Name</label>
                            <input
                              type="text"
                              name="lastName"
                              [(ngModel)]="addressForm.lastName"
                              required
                            />
                          </div>
                        </div>
                        <div class="form-group">
                          <label>Address Line 1</label>
                          <input
                            type="text"
                            name="addressLine1"
                            [(ngModel)]="addressForm.addressLine1"
                            required
                          />
                        </div>
                        <div class="form-group">
                          <label>Address Line 2 (Optional)</label>
                          <input
                            type="text"
                            name="addressLine2"
                            [(ngModel)]="addressForm.addressLine2"
                          />
                        </div>
                        <div class="form-row">
                          <div class="form-group">
                            <label>City</label>
                            <input
                              type="text"
                              name="city"
                              [(ngModel)]="addressForm.city"
                              required
                            />
                          </div>
                          <div class="form-group">
                            <label>State</label>
                            <input
                              type="text"
                              name="state"
                              [(ngModel)]="addressForm.state"
                            />
                          </div>
                        </div>
                        <div class="form-row">
                          <div class="form-group">
                            <label>Postal Code</label>
                            <input
                              type="text"
                              name="postalCode"
                              [(ngModel)]="addressForm.postalCode"
                              required
                            />
                          </div>
                          <div class="form-group">
                            <label>Country Code</label>
                            <input
                              type="text"
                              name="countryCode"
                              [(ngModel)]="addressForm.countryCode"
                              required
                              maxlength="2"
                              placeholder="AU"
                            />
                          </div>
                        </div>
                        <div class="form-group">
                          <label>Phone (Optional)</label>
                          <input
                            type="tel"
                            name="phone"
                            [(ngModel)]="addressForm.phone"
                          />
                        </div>
                        <div class="form-actions">
                          <button
                            type="button"
                            class="btn-secondary"
                            (click)="showAddressForm.set(false)"
                          >
                            Cancel
                          </button>
                          <button type="submit" class="btn-primary" [disabled]="savingAddress()">
                            {{ savingAddress() ? "Saving..." : "Save Address" }}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                }

                <div class="step-actions">
                  <button class="btn-secondary" (click)="facade.navigateToCart()">
                    <i class="bi bi-arrow-left"></i> Back to Cart
                  </button>
                  <button
                    class="btn-primary"
                    [disabled]="!canProceedFromAddress()"
                    (click)="proceedToShipping()"
                  >
                    Continue to Shipping <i class="bi bi-arrow-right"></i>
                  </button>
                </div>
              </div>
            }

            <!-- Step 2: Shipping Method -->
            @if (facade.step() === "shipping") {
              <div class="checkout-section">
                <h2>Shipping Method</h2>

                @if (facade.shippingMethods().length === 0) {
                  <div class="loading">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                  </div>
                } @else {
                  <div class="shipping-methods">
                    @for (method of facade.shippingMethods(); track method.id) {
                      <div
                        class="shipping-card"
                        [class.selected]="facade.selectedShippingMethodId() === method.id"
                        (click)="facade.selectShippingMethod(method.id)"
                      >
                        <div class="shipping-radio">
                          <input
                            type="radio"
                            name="shippingMethod"
                            [checked]="facade.selectedShippingMethodId() === method.id"
                            (change)="facade.selectShippingMethod(method.id)"
                          />
                        </div>
                        <div class="shipping-info">
                          <div class="shipping-name">{{ method.name }}</div>
                          @if (method.description) {
                            <div class="shipping-desc">{{ method.description }}</div>
                          }
                          <div class="shipping-time">
                            {{ method.estimatedMinDays }}-{{ method.estimatedMaxDays }} business days
                          </div>
                        </div>
                        <div class="shipping-price">
                          {{ method.price | money }}
                        </div>
                      </div>
                    }
                  </div>
                }

                <div class="step-actions">
                  <button class="btn-secondary" (click)="facade.prevStep()">
                    <i class="bi bi-arrow-left"></i> Back
                  </button>
                  <button
                    class="btn-primary"
                    [disabled]="!facade.selectedShippingMethodId()"
                    (click)="proceedToReview()"
                  >
                    Continue to Review <i class="bi bi-arrow-right"></i>
                  </button>
                </div>
              </div>
            }

            <!-- Step 3: Review -->
            @if (facade.step() === "review") {
              <div class="checkout-section">
                <h2>Review Order</h2>

                <!-- Items -->
                <div class="review-section">
                  <h3>Items</h3>
                  <div class="review-items">
                    @for (item of cart.items(); track item.id) {
                      <div class="review-item">
                        <div class="review-item-image">
                          @if (item.imageUrl) {
                            <img [src]="item.imageUrl" [alt]="item.productName" />
                          } @else {
                            <div class="no-image"><i class="bi bi-image"></i></div>
                          }
                        </div>
                        <div class="review-item-details">
                          <div class="review-item-name">{{ item.productName }}</div>
                          <div class="review-item-variant">
                            @for (entry of getOptionsArray(item.options); track entry[0]) {
                              <span>{{ entry[0] }}: {{ entry[1] }}</span>
                            }
                          </div>
                          <div class="review-item-qty">Qty: {{ item.quantity }}</div>
                        </div>
                        <div class="review-item-price">
                          {{ item.lineTotal | money }}
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Addresses -->
                <div class="review-section">
                  <h3>Shipping Address</h3>
                  @if (facade.shippingAddress(); as addr) {
                    <div class="review-address">
                      <div>{{ addr.firstName }} {{ addr.lastName }}</div>
                      <div>{{ addr.addressLine1 }}</div>
                      @if (addr.addressLine2) {
                        <div>{{ addr.addressLine2 }}</div>
                      }
                      <div>{{ addr.city }}{{ addr.state ? ', ' + addr.state : '' }} {{ addr.postalCode }}</div>
                      <div>{{ addr.countryCode }}</div>
                    </div>
                  }
                </div>

                <div class="review-section">
                  <h3>Shipping Method</h3>
                  @if (facade.selectedShippingMethod(); as method) {
                    <div class="review-shipping">
                      <span>{{ method.name }}</span>
                      <span>{{ method.price | money }}</span>
                    </div>
                  }
                </div>

                <div class="step-actions">
                  <button class="btn-secondary" (click)="facade.prevStep()">
                    <i class="bi bi-arrow-left"></i> Back
                  </button>
                  <button
                    class="btn-primary btn-place-order"
                    [disabled]="facade.loading()"
                    (click)="placeOrder()"
                  >
                    @if (facade.loading()) {
                      <span class="spinner"></span> Processing...
                    } @else {
                      <i class="bi bi-lock"></i> Place Order — {{ cart.cart().grandTotal | money }}
                    }
                  </button>
                </div>
              </div>
            }

            <!-- Step 4: Confirmation -->
            @if (facade.step() === "confirm") {
              @if (facade.orderResult(); as result) {
                <div class="checkout-section confirmation">
                  <div class="confirmation-icon">
                    <i class="bi bi-check-circle-fill"></i>
                  </div>
                  <h2>Order Confirmed!</h2>
                  <p class="confirmation-message">
                    Thank you for your order. Your order number is
                    <strong>{{ result.order.id }}</strong>.
                  </p>

                  <div class="confirmation-details">
                    <div class="confirmation-row">
                      <span>Order ID</span>
                      <span>{{ result.order.id }}</span>
                    </div>
                    <div class="confirmation-row">
                      <span>Status</span>
                      <span class="status-badge">{{ result.order.status }}</span>
                    </div>
                    <div class="confirmation-row">
                      <span>Total</span>
                      <span>{{ result.order.grandTotal | money }}</span>
                    </div>
                    <div class="confirmation-row">
                      <span>Payment</span>
                      <span class="status-badge">{{ result.payment.status }}</span>
                    </div>
                  </div>

                  <div class="confirmation-actions">
                    <a routerLink="/orders" class="btn-primary">View Orders</a>
                    <a routerLink="/products" class="btn-secondary">Continue Shopping</a>
                  </div>
                </div>
              }
            }
          </div>

          <!-- Order summary sidebar -->
          @if (facade.step() !== "confirm") {
            <div class="checkout-sidebar">
              <div class="summary-card">
                <h3>Order Summary</h3>
                <div class="summary-items">
                  @for (item of cart.items(); track item.id) {
                    <div class="summary-item">
                      <div class="summary-item-info">
                        <span class="summary-item-name">{{ item.productName }}</span>
                        <span class="summary-item-qty">x{{ item.quantity }}</span>
                      </div>
                      <span class="summary-item-price">{{ item.lineTotal | money }}</span>
                    </div>
                  }
                </div>
                <div class="summary-totals">
                  <div class="summary-row">
                    <span>Subtotal</span>
                    <span>{{ cart.cart().subtotal | money }}</span>
                  </div>
                  @if (cart.cart().discountTotal !== '0.00') {
                    <div class="summary-row discount">
                      <span>Discount</span>
                      <span>-{{ cart.cart().discountTotal | money }}</span>
                    </div>
                  }
                  @if (facade.quote(); as q) {
                    <div class="summary-row">
                      <span>Shipping</span>
                      <span>{{ q.shippingTotal | money }}</span>
                    </div>
                    @if (q.taxTotal !== '0.00') {
                      <div class="summary-row">
                        <span>Tax</span>
                        <span>{{ q.taxTotal | money }}</span>
                      </div>
                    }
                  } @else {
                    <div class="summary-row">
                      <span>Shipping</span>
                      <span class="muted">Calculated next</span>
                    </div>
                  }
                  <div class="summary-row total">
                    <span>Total</span>
                    <span>{{ cart.cart().grandTotal | money }}</span>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: `
    .checkout-auth-required {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
    }

    .empty-state-icon {
      font-size: 3rem;
      color: var(--color-muted);
      margin-bottom: 1rem;
    }

    .empty-state h2 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: var(--color-muted);
      margin-bottom: 1.5rem;
    }

    .checkout-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .step-indicator {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .step {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      opacity: 0.5;
      transition: opacity 0.2s;
    }

    .step.active,
    .step.completed {
      opacity: 1;
    }

    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .step.active .step-number {
      background: var(--color-primary);
      color: white;
    }

    .step.completed .step-number {
      background: var(--color-success, #10b981);
      color: white;
    }

    .step-label {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .checkout-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 2rem;
      align-items: start;
    }

    @media (max-width: 900px) {
      .checkout-layout {
        grid-template-columns: 1fr;
      }
    }

    .checkout-section {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .checkout-section h2 {
      font-size: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .checkout-section h3 {
      font-size: 1rem;
      margin: 1.5rem 0 0.75rem;
    }

    .address-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .address-card {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border: 2px solid var(--color-border);
      border-radius: 8px;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    .address-card:hover {
      border-color: var(--color-primary);
    }

    .address-card.selected {
      border-color: var(--color-primary);
      background: color-mix(in srgb, var(--color-primary) 5%, white);
    }

    .address-radio {
      padding-top: 0.25rem;
    }

    .address-info {
      flex: 1;
    }

    .address-name {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .address-line {
      font-size: 0.875rem;
      color: var(--color-text);
    }

    .address-phone {
      font-size: 0.875rem;
      color: var(--color-muted);
      margin-top: 0.25rem;
    }

    .badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      background: var(--color-primary);
      color: white;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-top: 0.5rem;
    }

    .same-billing {
      margin: 1rem 0;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .empty-addresses {
      padding: 2rem;
      text-align: center;
      background: var(--color-background);
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .shipping-methods {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .shipping-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 2px solid var(--color-border);
      border-radius: 8px;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    .shipping-card:hover {
      border-color: var(--color-primary);
    }

    .shipping-card.selected {
      border-color: var(--color-primary);
      background: color-mix(in srgb, var(--color-primary) 5%, white);
    }

    .shipping-radio {
      padding-top: 0.25rem;
    }

    .shipping-info {
      flex: 1;
    }

    .shipping-name {
      font-weight: 600;
    }

    .shipping-desc {
      font-size: 0.875rem;
      color: var(--color-muted);
    }

    .shipping-time {
      font-size: 0.875rem;
      color: var(--color-text);
      margin-top: 0.25rem;
    }

    .shipping-price {
      font-weight: 600;
      white-space: nowrap;
    }

    .review-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--color-border);
    }

    .review-section:last-of-type {
      border-bottom: none;
    }

    .review-items {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .review-item {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .review-item-image {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      background: var(--color-background);
    }

    .review-item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-image {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-muted);
    }

    .review-item-details {
      flex: 1;
    }

    .review-item-name {
      font-weight: 500;
    }

    .review-item-variant {
      font-size: 0.8125rem;
      color: var(--color-muted);
    }

    .review-item-variant span + span::before {
      content: " | ";
    }

    .review-item-qty {
      font-size: 0.8125rem;
      color: var(--color-text);
    }

    .review-item-price {
      font-weight: 600;
      white-space: nowrap;
    }

    .review-address {
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .review-shipping {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }

    .step-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--color-border);
    }

    .summary-card {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 1.5rem;
      position: sticky;
      top: 100px;
    }

    .summary-card h3 {
      font-size: 1rem;
      margin-bottom: 1rem;
    }

    .summary-items {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-border);
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }

    .summary-item-info {
      display: flex;
      gap: 0.5rem;
    }

    .summary-item-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 200px;
    }

    .summary-item-qty {
      color: var(--color-muted);
    }

    .summary-totals {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }

    .summary-row.discount {
      color: var(--color-success, #10b981);
    }

    .summary-row.total {
      font-weight: 700;
      font-size: 1rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--color-border);
    }

    .muted {
      color: var(--color-muted);
      font-style: italic;
    }

    .confirmation {
      text-align: center;
      padding: 3rem;
    }

    .confirmation-icon {
      font-size: 4rem;
      color: var(--color-success, #10b981);
      margin-bottom: 1rem;
    }

    .confirmation h2 {
      margin-bottom: 0.5rem;
    }

    .confirmation-message {
      color: var(--color-muted);
      margin-bottom: 2rem;
    }

    .confirmation-details {
      max-width: 400px;
      margin: 0 auto 2rem;
      text-align: left;
    }

    .confirmation-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--color-border);
      font-size: 0.875rem;
    }

    .status-badge {
      padding: 0.125rem 0.5rem;
      background: var(--color-primary);
      color: white;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .confirmation-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .btn-primary {
      padding: 0.75rem 1.5rem;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: opacity 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      opacity: 0.9;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      padding: 0.75rem 1.5rem;
      background: transparent;
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: background 0.2s;
    }

    .btn-secondary:hover {
      background: var(--color-background);
    }

    .btn-place-order {
      background: var(--color-success, #10b981);
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .loading-bar {
      height: 60px;
      background: var(--color-background);
      border-radius: 8px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 0.3; }
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-content h3 {
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.375rem;
    }

    .form-group input {
      width: 100%;
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      font-size: 0.875rem;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .empty-addresses {
      padding: 2rem;
      text-align: center;
      background: var(--color-background);
      border-radius: 8px;
      margin-bottom: 1rem;
    }
  `,
})
export class CheckoutPage implements OnInit {
  readonly facade = inject(CheckoutFacade);
  readonly cart = inject(CartFacade);
  readonly auth = inject(AuthFacade);

  showAddressForm = signal(false);
  savingAddress = signal(false);
  sameAsShipping = signal(true);

  addressForm: CreateAddressPayload = {
    firstName: "",
    lastName: "",
    addressLine1: "",
    city: "",
    postalCode: "",
    countryCode: "AU",
  };

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.facade.loadAddresses();
      this.facade.loadShippingMethods();
    }
  }

  getStepLabel(step: CheckoutStep): string {
    const labels: Record<CheckoutStep, string> = {
      address: "Address",
      shipping: "Shipping",
      review: "Review",
      confirm: "Confirm",
    };
    return labels[step];
  }

  getOptionsArray(options: Record<string, string>): [string, string][] {
    return Object.entries(options);
  }

  canProceedFromAddress(): boolean {
    const hasShipping = !!this.facade.selectedShippingAddressId();
    const hasBilling =
      this.sameAsShipping() || !!this.facade.selectedBillingAddressId();
    return hasShipping && hasBilling;
  }

  toggleSameAsShipping(): void {
    this.sameAsShipping.update((v) => !v);
    if (this.sameAsShipping()) {
      this.facade.selectBillingAddress(this.facade.selectedShippingAddressId()!);
    }
  }

  async submitAddress(event: Event): Promise<void> {
    event.preventDefault();
    this.savingAddress.set(true);

    const address = await this.facade.addAddress(this.addressForm);
    if (address) {
      this.facade.selectShippingAddress(address.id);
      if (this.sameAsShipping()) {
        this.facade.selectBillingAddress(address.id);
      }
      this.showAddressForm.set(false);
      this.resetAddressForm();
    }

    this.savingAddress.set(false);
  }

  private resetAddressForm(): void {
    this.addressForm = {
      firstName: "",
      lastName: "",
      addressLine1: "",
      city: "",
      postalCode: "",
      countryCode: "AU",
    };
  }

  proceedToShipping(): void {
    this.facade.nextStep();
  }

  async proceedToReview(): Promise<void> {
    await this.facade.loadQuote();
    this.facade.nextStep();
  }

  async placeOrder(): Promise<void> {
    await this.facade.placeOrder();
  }
}
