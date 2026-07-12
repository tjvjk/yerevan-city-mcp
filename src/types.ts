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

export interface Cart {
  totalPrice: number;
  deliveryFee: number;
  items: CartItem[];
  address: CartAddress | null;
}
