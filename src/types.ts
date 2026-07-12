export interface Product {
  id: number;
  nameEn: string;
  nameRu: string;
  nameArm: string;
  price: number;
  isKilogram: boolean;
  minimumWeight: number | null;
  weightStep: number | null;
  discountPercent: number;
  photo: string;
}

export interface ProductSearchResult {
  pageCount: number;
  itemCount: number;
  products: Product[];
}

export interface Address {
  id: number;
  lat: number;
  lng: number;
  street: string;
  city: string;
  title: string;
  isDefault: boolean;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  count: number;
  weight: number;
  isKilogram: boolean;
  isBag: boolean;
}

export interface CartAddress {
  id: number;
  lat: number;
  lng: number;
  street: string;
  city: string;
}

/**
 * yerevan-city.am's own cart endpoint reports `totalPrice: 0` even with
 * items present in some observed responses — this mirrors the API as-is
 * rather than computing a total client-side, since the per-item `price` is
 * accurate. Sum `items[].price` if a reliable total is needed.
 */
export interface Cart {
  totalPrice: number;
  deliveryFee: number;
  items: CartItem[];
  address: CartAddress | null;
}
