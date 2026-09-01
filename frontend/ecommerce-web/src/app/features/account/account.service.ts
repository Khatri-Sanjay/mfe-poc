import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../core/http/api-client.service';
import { Address, AddressPayload, User } from '../../core/models/commerce.models';

export interface ProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly api = inject(ApiClient);

  profile(): Promise<User> {
    return this.api.get<User>('/users/me');
  }

  updateProfile(payload: ProfilePayload): Promise<User> {
    return this.api.patch<User>('/users/me', payload);
  }

  changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.api.patch<void>('/users/me/password', { currentPassword, newPassword });
  }

  addresses(): Promise<Address[]> {
    return this.api.get<Address[]>('/users/me/addresses');
  }

  createAddress(payload: AddressPayload): Promise<Address> {
    return this.api.post<Address>('/users/me/addresses', payload);
  }

  updateAddress(id: string, payload: Partial<AddressPayload>): Promise<Address> {
    return this.api.patch<Address>(`/users/me/addresses/${id}`, payload);
  }

  deleteAddress(id: string): Promise<void> {
    return this.api.delete<void>(`/users/me/addresses/${id}`);
  }
}
