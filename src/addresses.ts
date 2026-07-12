import { ShopApiClient } from "./shop-api-client.js";
import { Address } from "./types.js";

interface RawAddress {
  id: number;
  lat: number;
  lng: number;
  street: string;
  city: string;
  title: string;
  isDefault: boolean;
}

interface RawAddressList {
  addresses: RawAddress[];
}

/**
 * Lists the delivery addresses saved on the logged-in user's account.
 * The cart is address-scoped, so an addressId from here is required
 * whenever items are added.
 */
export class Addresses {
  constructor(private readonly client: ShopApiClient) {}

  async all(): Promise<Address[]> {
    const raw = await this.client.get<RawAddressList>("/api/Address/GetAll");
    return raw.addresses.map((address) => ({
      id: address.id,
      lat: address.lat,
      lng: address.lng,
      street: address.street,
      city: address.city,
      title: address.title,
      isDefault: address.isDefault,
    }));
  }
}
