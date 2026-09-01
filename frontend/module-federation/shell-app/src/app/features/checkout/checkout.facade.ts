import { Injectable, inject, signal, computed } from "@angular/core";
import { Router } from "@angular/router";
import { CheckoutService } from "./checkout.service";
import { NotificationService } from "../../state/ui/notification.service";
import {
  Address,
  CheckoutPayload,
  CheckoutQuote,
  CheckoutResult,
  CreateAddressPayload,
  Order,
  ShippingMethod,
} from "../../core/models/commerce.models";

export type CheckoutStep = "address" | "shipping" | "review" | "confirm";

@Injectable({ providedIn: "root" })
export class CheckoutFacade {
  private checkoutService = inject(CheckoutService);
  private notifications = inject(NotificationService);
  private router = inject(Router);

  readonly step = signal<CheckoutStep>("address");
  readonly loading = signal(false);
  readonly addresses = signal<Address[]>([]);
  readonly shippingMethods = signal<ShippingMethod[]>([]);
  readonly selectedShippingAddressId = signal<string | null>(null);
  readonly selectedBillingAddressId = signal<string | null>(null);
  readonly selectedShippingMethodId = signal<string | null>(null);
  readonly quote = signal<CheckoutQuote | null>(null);
  readonly orderResult = signal<CheckoutResult | null>(null);
  readonly orders = signal<Order[]>([]);

  readonly steps: CheckoutStep[] = ["address", "shipping", "review", "confirm"];
  readonly stepIndex = computed(() => this.steps.indexOf(this.step()));

  readonly shippingAddress = computed(() => {
    const id = this.selectedShippingAddressId();
    return this.addresses().find((a) => a.id === id) ?? null;
  });

  readonly billingAddress = computed(() => {
    const id = this.selectedBillingAddressId();
    return this.addresses().find((a) => a.id === id) ?? null;
  });

  readonly selectedShippingMethod = computed(() => {
    const id = this.selectedShippingMethodId();
    return this.shippingMethods().find((m) => m.id === id) ?? null;
  });

  async loadAddresses(): Promise<void> {
    try {
      const addresses = await this.checkoutService.getAddresses();
      this.addresses.set(addresses);

      const defaultShipping = addresses.find((a) => a.isDefaultShipping);
      const defaultBilling = addresses.find((a) => a.isDefaultBilling);

      if (defaultShipping) {
        this.selectedShippingAddressId.set(defaultShipping.id);
      }
      if (defaultBilling) {
        this.selectedBillingAddressId.set(defaultBilling.id);
      } else if (defaultShipping) {
        this.selectedBillingAddressId.set(defaultShipping.id);
      }
    } catch {
      this.notifications.error("Failed to load addresses.");
    }
  }

  async addAddress(payload: CreateAddressPayload): Promise<Address | null> {
    try {
      const address = await this.checkoutService.createAddress(payload);
      this.addresses.update((list) => [...list, address]);
      this.notifications.success("Address added.");
      return address;
    } catch {
      this.notifications.error("Failed to add address.");
      return null;
    }
  }

  selectShippingAddress(id: string): void {
    this.selectedShippingAddressId.set(id);
  }

  selectBillingAddress(id: string): void {
    this.selectedBillingAddressId.set(id);
  }

  async loadShippingMethods(): Promise<void> {
    try {
      const methods = await this.checkoutService.getShippingMethods();
      this.shippingMethods.set(methods);
      if (methods.length > 0 && !this.selectedShippingMethodId()) {
        this.selectedShippingMethodId.set(methods[0].id);
      }
    } catch {
      this.notifications.error("Failed to load shipping methods.");
    }
  }

  selectShippingMethod(id: string): void {
    this.selectedShippingMethodId.set(id);
  }

  async loadQuote(): Promise<void> {
    const methodId = this.selectedShippingMethodId();
    if (!methodId) return;

    try {
      this.loading.set(true);
      const quote = await this.checkoutService.getQuote(methodId);
      this.quote.set(quote);
    } catch {
      this.notifications.error("Failed to calculate shipping.");
    } finally {
      this.loading.set(false);
    }
  }

  async placeOrder(): Promise<void> {
    const shippingAddressId = this.selectedShippingAddressId();
    const billingAddressId = this.selectedBillingAddressId();
    const shippingMethodId = this.selectedShippingMethodId();

    if (!shippingAddressId || !billingAddressId || !shippingMethodId) {
      this.notifications.error("Please complete all steps before placing order.");
      return;
    }

    try {
      this.loading.set(true);
      const payload: CheckoutPayload = {
        shippingAddressId,
        billingAddressId,
        shippingMethodId,
      };
      const result = await this.checkoutService.checkout(payload);
      this.orderResult.set(result);
      this.step.set("confirm");
      this.notifications.success("Order placed successfully!");
    } catch (err: any) {
      const message = err?.message || "Checkout failed. Please try again.";
      this.notifications.error(message);
    } finally {
      this.loading.set(false);
    }
  }

  nextStep(): void {
    const idx = this.stepIndex();
    if (idx < this.steps.length - 1) {
      this.step.set(this.steps[idx + 1]);
    }
  }

  prevStep(): void {
    const idx = this.stepIndex();
    if (idx > 0) {
      this.step.set(this.steps[idx - 1]);
    }
  }

  goToStep(step: CheckoutStep): void {
    const targetIdx = this.steps.indexOf(step);
    const currentIdx = this.stepIndex();
    if (targetIdx <= currentIdx) {
      this.step.set(step);
    }
  }

  async loadOrders(): Promise<void> {
    try {
      this.loading.set(true);
      const orders = await this.checkoutService.getOrders();
      this.orders.set(orders);
    } catch {
      this.notifications.error("Failed to load orders.");
    } finally {
      this.loading.set(false);
    }
  }

  async loadOrder(id: string): Promise<Order | null> {
    try {
      this.loading.set(true);
      return await this.checkoutService.getOrder(id);
    } catch {
      this.notifications.error("Failed to load order.");
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  async cancelOrder(id: string): Promise<boolean> {
    try {
      this.loading.set(true);
      await this.checkoutService.cancelOrder(id);
      this.notifications.success("Order cancelled.");
      return true;
    } catch {
      this.notifications.error("Failed to cancel order.");
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  reset(): void {
    this.step.set("address");
    this.loading.set(false);
    this.addresses.set([]);
    this.shippingMethods.set([]);
    this.selectedShippingAddressId.set(null);
    this.selectedBillingAddressId.set(null);
    this.selectedShippingMethodId.set(null);
    this.quote.set(null);
    this.orderResult.set(null);
  }

  navigateToCart(): void {
    this.router.navigate(["/cart"]);
  }

  navigateToOrders(): void {
    this.router.navigate(["/orders"]);
  }

  navigateToOrder(id: string): void {
    this.router.navigate(["/orders", id]);
  }
}
