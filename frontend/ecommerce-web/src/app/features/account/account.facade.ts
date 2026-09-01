import { inject, Injectable, signal } from '@angular/core';
import { Address, AddressPayload, User } from '../../core/models/commerce.models';
import { AuthFacade } from '../../state/auth/auth.facade';
import { NotificationService } from '../../state/ui/notification.service';
import { AccountService, ProfilePayload } from './account.service';

@Injectable({ providedIn: 'root' })
export class AccountFacade {
  private readonly service = inject(AccountService);
  private readonly auth = inject(AuthFacade);
  private readonly notifications = inject(NotificationService);

  readonly profile = signal<User | null>(this.auth.currentUser());
  readonly addresses = signal<Address[]>([]);
  readonly loading = signal(false);

  async load(): Promise<void> {
    await this.run(async () => {
      const [profile, addresses] = await Promise.all([this.service.profile(), this.service.addresses()]);
      this.profile.set(profile);
      this.addresses.set(addresses);
    });
  }

  async updateProfile(payload: ProfilePayload): Promise<void> {
    await this.run(async () => {
      const profile = await this.service.updateProfile(payload);
      this.profile.set(profile);
      this.auth.currentUser.set(profile);
      this.notifications.success('Profile updated.');
    });
  }

  async createAddress(payload: AddressPayload): Promise<void> {
    await this.run(async () => {
      await this.service.createAddress(payload);
      this.addresses.set(await this.service.addresses());
      this.notifications.success('Address saved.');
    });
  }

  async updateAddress(id: string, payload: Partial<AddressPayload>): Promise<void> {
    await this.run(async () => {
      await this.service.updateAddress(id, payload);
      this.addresses.set(await this.service.addresses());
      this.notifications.success('Address updated.');
    });
  }

  async deleteAddress(id: string): Promise<void> {
    await this.run(async () => {
      await this.service.deleteAddress(id);
      this.addresses.set(await this.service.addresses());
      this.notifications.success('Address deleted.');
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.run(async () => {
      await this.service.changePassword(currentPassword, newPassword);
      this.notifications.success('Password changed.');
    });
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.loading.set(true);
    try {
      await action();
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'Account action failed.');
    } finally {
      this.loading.set(false);
    }
  }
}
