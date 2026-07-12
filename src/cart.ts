import { ShopApiClient } from "./shop-api-client.js";
import { StoredSession } from "./session-store.js";
import { Cart, CartItem } from "./types.js";

interface RawCartItem {
  id: number;
  name: string;
  price: number;
  count: number;
  weight: number;
  isKilogram: boolean;
  isBag: boolean;
  isMissing: boolean;
  stockDetails: { availableCount: number; availableWeight: number } | null;
}

interface RawCart {
  totalPrice: number;
  deliveryFee: number;
  items: RawCartItem[] | null;
  cartUserAddress: {
    id: number;
    lat: number;
    lng: number;
    street: string;
    city: string;
  } | null;
}

export class NoDeliveryAddressError extends Error {
  constructor() {
    super(
      "The account has no saved delivery address, call list_addresses first and pass an addressId",
    );
  }
}

/**
 * Adds, updates, removes and reads items in the yerevan-city.am cart for the
 * currently logged-in user. The remote cart is scoped to a delivery address,
 * so every call needs one; when the caller doesn't supply one, the account's
 * default address (from list_addresses) is used.
 *
 * yerevan-city.am prices some products by the piece and others by weight
 * (`isKilogram` on the product). Piece-counted products are added with
 * `quantity` set to a unit count and `weight` at 0; weight-based products are
 * added with `weight` set to a gram amount and `quantity` mirroring it.
 *
 * Reading the cart without passing a delivery address makes the API skip
 * stock and pricing checks entirely: `totalPrice`/`deliveryFee` come back as
 * 0 and every item's stock fields come back null. Passing the address is
 * what makes the API report real totals and per-item availability
 * (`isMissing` / `stockDetails`), matching what the site itself shows on its
 * cart page.
 */
export class ShopCart {
  constructor(
    private readonly client: ShopApiClient,
    private readonly session: StoredSession,
  ) {}

  async addByCount(productId: number, count: number, addressId?: number): Promise<void> {
    await this.update(productId, 0, count, addressId);
  }

  async addByWeight(productId: number, grams: number, addressId?: number): Promise<void> {
    await this.update(productId, grams, grams, addressId);
  }

  async remove(productId: number, addressId?: number): Promise<void> {
    await this.update(productId, 0, 0, addressId);
  }

  async contents(addressId?: number): Promise<Cart> {
    const resolvedAddressId = this.resolveAddressId(addressId);
    const raw = await this.client.post<RawCart>("/api/Cart/GetCartItems", {
      addressId: resolvedAddressId,
      lat: this.session.lat,
      lng: this.session.lng,
    });
    return {
      totalPrice: raw.totalPrice,
      deliveryFee: raw.deliveryFee,
      items: (raw.items ?? [])
        .filter((item) => !item.isBag)
        .map(toCartItem),
      address:
        raw.cartUserAddress === null
          ? null
          : {
              id: raw.cartUserAddress.id,
              lat: raw.cartUserAddress.lat,
              lng: raw.cartUserAddress.lng,
              street: raw.cartUserAddress.street,
              city: raw.cartUserAddress.city,
            },
    };
  }

  private async update(
    productId: number,
    weight: number,
    quantity: number,
    addressId: number | undefined,
  ): Promise<void> {
    await this.client.post<boolean>("/api/Cart/UpdateItems", {
      addressId: this.resolveAddressId(addressId),
      id: productId,
      weight,
      quantity,
      note: "",
      cut: false,
      grind: false,
      lat: this.session.lat,
      lng: this.session.lng,
      isGreenLine: false,
    });
  }

  private resolveAddressId(addressId: number | undefined): number {
    const resolved = addressId ?? this.session.addressId;
    if (resolved === null) throw new NoDeliveryAddressError();
    return resolved;
  }
}

function toCartItem(raw: RawCartItem): CartItem {
  return {
    id: raw.id,
    name: raw.name,
    price: raw.price,
    count: raw.count,
    weight: raw.weight,
    isKilogram: raw.isKilogram,
    isBag: raw.isBag,
    isMissing: raw.isMissing,
    availableCount: raw.stockDetails?.availableCount ?? 0,
    availableWeight: raw.stockDetails?.availableWeight ?? 0,
  };
}
