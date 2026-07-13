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

export interface RecipeIngredient {
  name: string;
  measure: string;
}

export interface Recipe {
  name: string;
  category: string;
  area: string;
  ingredients: RecipeIngredient[];
  instructions?: string;
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

/**
 * `isMissing` and the available stock numbers are only populated by the
 * yerevan-city.am API when the cart is read with an explicit delivery
 * address — see ShopCart.contents. A missing item stays in the cart but
 * cannot actually be delivered, similar to the site's own "Out of Stock"
 * label.
 */
export interface CartItem {
  id: number;
  name: string;
  price: number;
  count: number;
  weight: number;
  isKilogram: boolean;
  isBag: boolean;
  isMissing: boolean;
  availableCount: number;
  availableWeight: number;
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
