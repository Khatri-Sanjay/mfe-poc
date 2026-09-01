import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { AddressResponseDto, CreateAddressDto, UpdateAddressDto } from '../dto/address.dto';
import { Address } from '../entities/address.entity';

const mapAddress = (address: Address): AddressResponseDto => ({
	id: address.id,
	firstName: address.firstName,
	lastName: address.lastName,
	company: address.company,
	addressLine1: address.addressLine1,
	addressLine2: address.addressLine2,
	city: address.city,
	state: address.state,
	postalCode: address.postalCode,
	countryCode: address.countryCode,
	phone: address.phone,
	isDefaultShipping: address.isDefaultShipping,
	isDefaultBilling: address.isDefaultBilling
});

@Injectable()
export class AddressesService {
	constructor(@InjectRepository(Address) private readonly repository: Repository<Address>) {}

	async list(userId: string): Promise<AddressResponseDto[]> {
		return (
			await this.repository.find({
				where: { userId },
				order: { createdAt: 'DESC' }
			})
		).map(mapAddress);
	}

	async get(userId: string, id: string): Promise<AddressResponseDto> {
		return mapAddress(await this.findOwned(userId, id));
	}

	async create(userId: string, dto: CreateAddressDto): Promise<AddressResponseDto> {
		await this.clearDefaults(userId, dto.isDefaultShipping, dto.isDefaultBilling);
		return mapAddress(
			await this.repository.save(
				this.repository.create({
					userId,
					firstName: dto.firstName,
					lastName: dto.lastName,
					company: dto.company ?? null,
					addressLine1: dto.addressLine1,
					addressLine2: dto.addressLine2 ?? null,
					city: dto.city,
					state: dto.state ?? null,
					postalCode: dto.postalCode,
					countryCode: dto.countryCode,
					phone: dto.phone ?? null,
					isDefaultShipping: dto.isDefaultShipping ?? false,
					isDefaultBilling: dto.isDefaultBilling ?? false
				})
			)
		);
	}

	async update(userId: string, id: string, dto: UpdateAddressDto): Promise<AddressResponseDto> {
		const address = await this.findOwned(userId, id);
		await this.clearDefaults(userId, dto.isDefaultShipping, dto.isDefaultBilling);
		Object.assign(address, {
			...dto,
			company: dto.company ?? address.company,
			addressLine2: dto.addressLine2 ?? address.addressLine2,
			state: dto.state ?? address.state,
			phone: dto.phone ?? address.phone
		});
		return mapAddress(await this.repository.save(address));
	}

	async delete(userId: string, id: string): Promise<{ status: string }> {
		await this.repository.remove(await this.findOwned(userId, id));
		return { status: 'deleted' };
	}

	async findOwned(userId: string, id: string): Promise<Address> {
		const address = await this.repository.findOne({ where: { id, userId } });
		if (!address) {
			throw new NotFoundException({
				errorCode: ErrorCode.ResourceNotFound,
				message: 'Address was not found'
			});
		}
		return address;
	}

	private async clearDefaults(userId: string, shipping?: boolean, billing?: boolean): Promise<void> {
		if (shipping) {
			await this.repository.update({ userId, isDefaultShipping: true }, { isDefaultShipping: false });
		}
		if (billing) {
			await this.repository.update({ userId, isDefaultBilling: true }, { isDefaultBilling: false });
		}
	}
}
