import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.service';
import { AuthFacade } from '../../state/auth/auth.facade';
import { Address } from '../../core/models/commerce.models';
import { AccountFacade } from './account.facade';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, RouterLinkActive],
  template: `
    <section class="account-page">
      <aside class="account-nav">
        <a routerLink="/account/profile" routerLinkActive="active">Profile</a>
        <a routerLink="/account/addresses" routerLinkActive="active">Addresses</a>
        <a routerLink="/account/security" routerLinkActive="active">Security</a>
        <a routerLink="/account/wishlist" routerLinkActive="active">Wishlist</a>
      </aside>

      <div class="surface">
        @if (tab === 'profile') {
          <h1>Profile</h1>
          <form class="stack-form" [formGroup]="profileForm" (ngSubmit)="saveProfile()">
            <div class="form-grid">
              <label>First name <input formControlName="firstName" /></label>
              <label>Last name <input formControlName="lastName" /></label>
            </div>
            <label>Phone <input formControlName="phone" /></label>
            <p class="muted">{{ account.profile()?.email }} - {{ account.profile()?.status }} - Verified: {{ account.profile()?.emailVerified ? 'yes' : 'no' }}</p>
            <button class="btn-primary" type="submit" [disabled]="profileForm.invalid || account.loading()">Save profile</button>
          </form>
        }

        @if (tab === 'addresses') {
          <h1>Addresses</h1>
          <form class="address-form" [formGroup]="addressForm" (ngSubmit)="saveAddress()">
            <input formControlName="firstName" placeholder="First name" />
            <input formControlName="lastName" placeholder="Last name" />
            <input formControlName="addressLine1" placeholder="Address line 1" />
            <input formControlName="addressLine2" placeholder="Address line 2" />
            <input formControlName="city" placeholder="City" />
            <input formControlName="state" placeholder="State" />
            <input formControlName="postalCode" placeholder="Postal code" />
            <input formControlName="countryCode" maxlength="2" placeholder="AU" />
            <input formControlName="phone" placeholder="Phone" />
            <label class="check-row"><input type="checkbox" formControlName="isDefaultShipping" /> Default shipping</label>
            <label class="check-row"><input type="checkbox" formControlName="isDefaultBilling" /> Default billing</label>
            <button class="btn-secondary" type="submit" [disabled]="addressForm.invalid">{{ editingAddressId ? 'Update address' : 'Save address' }}</button>
            @if (editingAddressId) {
              <button class="btn-secondary" type="button" (click)="resetAddressForm()">Cancel edit</button>
            }
          </form>
          <div class="saved-list mt-4">
            @for (address of account.addresses(); track address.id) {
              <article>
                <div>
                  <strong>{{ address.firstName }} {{ address.lastName }}</strong>
                  <span>{{ address.addressLine1 }}, {{ address.city }}, {{ address.countryCode }}</span>
                </div>
                <button class="btn-secondary compact" type="button" (click)="editAddress(address)">Edit</button>
                <button class="icon-btn danger" type="button" aria-label="Delete address" (click)="deleteAddress(address.id)"><i class="bi bi-trash"></i></button>
              </article>
            }
          </div>
        }

        @if (tab === 'security') {
          <h1>Security</h1>
          <form class="stack-form" [formGroup]="passwordForm" (ngSubmit)="changePassword()">
            <label>Current password <input type="password" formControlName="currentPassword" autocomplete="current-password" /></label>
            <label>New password <input type="password" formControlName="newPassword" autocomplete="new-password" /></label>
            <div class="inline-actions">
              <button class="btn-primary" type="submit" [disabled]="passwordForm.invalid">Change password</button>
              <button class="btn-secondary" type="button" (click)="auth.logoutAll()">Logout all sessions</button>
            </div>
          </form>
        }
      </div>
    </section>
  `,
})
export class AccountPage implements OnInit {
  readonly account = inject(AccountFacade);
  readonly auth = inject(AuthFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  tab = 'profile';
  editingAddressId = '';

  readonly profileForm = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl('', { nonNullable: true }),
  });

  readonly addressForm = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    addressLine1: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    addressLine2: new FormControl('', { nonNullable: true }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    state: new FormControl('', { nonNullable: true }),
    postalCode: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    countryCode: new FormControl('AU', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[A-Z]{2}$/)] }),
    phone: new FormControl('', { nonNullable: true }),
    isDefaultShipping: new FormControl(true, { nonNullable: true }),
    isDefaultBilling: new FormControl(true, { nonNullable: true }),
  });

  readonly passwordForm = new FormGroup({
    currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(12), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)] }),
  });

  async ngOnInit(): Promise<void> {
    this.tab = String(this.route.snapshot.data['tab'] ?? 'profile');
    await this.account.load();
    const profile = this.account.profile();
    if (profile) {
      this.profileForm.patchValue({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone ?? '' });
    }
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) return;
    const value = this.profileForm.getRawValue();
    await this.account.updateProfile({ ...value, phone: value.phone || undefined });
  }

  async saveAddress(): Promise<void> {
    if (this.addressForm.invalid) return;
    const value = this.addressForm.getRawValue();
    const payload = {
      ...value,
      addressLine2: value.addressLine2 || undefined,
      state: value.state || undefined,
      phone: value.phone || undefined,
    };
    if (this.editingAddressId) {
      await this.account.updateAddress(this.editingAddressId, payload);
    } else {
      await this.account.createAddress(payload);
    }
    this.resetAddressForm();
  }

  editAddress(address: Address): void {
    this.editingAddressId = address.id;
    this.addressForm.patchValue({
      firstName: address.firstName,
      lastName: address.lastName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? '',
      city: address.city,
      state: address.state ?? '',
      postalCode: address.postalCode,
      countryCode: address.countryCode,
      phone: address.phone ?? '',
      isDefaultShipping: address.isDefaultShipping,
      isDefaultBilling: address.isDefaultBilling,
    });
  }

  resetAddressForm(): void {
    this.editingAddressId = '';
    this.addressForm.reset({ firstName: '', lastName: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', countryCode: 'AU', phone: '', isDefaultShipping: true, isDefaultBilling: true });
  }

  async deleteAddress(id: string): Promise<void> {
    if (await this.confirmDialog.confirm('Delete address', 'This address will be permanently removed.', 'Delete address')) {
      await this.account.deleteAddress(id);
    }
  }

  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) return;
    const value = this.passwordForm.getRawValue();
    await this.account.changePassword(value.currentPassword, value.newPassword);
    this.passwordForm.reset({ currentPassword: '', newPassword: '' });
  }
}
