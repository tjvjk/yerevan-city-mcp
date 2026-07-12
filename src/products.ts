import { ShopApiClient } from "./shop-api-client.js";
import { Product, ProductSearchResult } from "./types.js";

interface RawProduct {
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

interface RawSearchResult {
  pageCount: number;
  itemCount: number;
  products: RawProduct[];
}

/**
 * Searches the yerevan-city.am product catalogue by free-text query.
 */
export class ProductSearch {
  constructor(private readonly client: ShopApiClient) {}

  async run(query: string, page: number): Promise<ProductSearchResult> {
    const raw = await this.client.post<RawSearchResult>("/api/Product/Search", {
      count: 20,
      page,
      priceFrom: null,
      priceTo: null,
      countries: [],
      categories: [],
      brands: [],
      search: query,
      isDiscounted: false,
      sortBy: 3,
    });
    return {
      pageCount: raw.pageCount,
      itemCount: raw.itemCount,
      products: raw.products.map(toProduct),
    };
  }
}

function toProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    nameEn: raw.nameEn,
    nameRu: raw.nameRu,
    nameArm: raw.nameArm,
    price: raw.price,
    isKilogram: raw.isKilogram,
    minimumWeight: raw.minimumWeight,
    weightStep: raw.weightStep,
    discountPercent: raw.discountPercent,
    photo: raw.photo,
  };
}
