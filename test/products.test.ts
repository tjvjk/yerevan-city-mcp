import { describe, it, expect } from "vitest";
import { ShopApiClient } from "../src/shop-api-client.js";
import { ProductSearch } from "../src/products.js";
import { withFakeFetch } from "./fake-fetch.js";

describe("ProductSearch", () => {
  it("maps a raw search result to the public Product shape", async () => {
    const id = Math.floor(Math.random() * 1000000);
    const raw = {
      pageCount: 3,
      itemCount: 42,
      products: [
        {
          id,
          nameEn: "Banana Sabrostar kg",
          nameRu: "Банан Sabrostar кг",
          nameArm: "Բանան «Սաբրոստար» կգ",
          price: 535,
          isKilogram: true,
          minimumWeight: 500,
          weightStep: 100,
          discountPercent: 0,
          photo: "https://media.yerevan-city.am/api/Image/Resize/ProductPhoto/1044057.png",
        },
      ],
    };
    const result = await withFakeFetch({ success: true, data: raw, messages: [] }, () =>
      new ProductSearch(new ShopApiClient(null)).run("banan", 1),
    );
    expect(result.products[0]).toEqual({
      id,
      nameEn: raw.products[0].nameEn,
      nameRu: raw.products[0].nameRu,
      nameArm: raw.products[0].nameArm,
      price: raw.products[0].price,
      isKilogram: true,
      minimumWeight: 500,
      weightStep: 100,
      discountPercent: 0,
      photo: raw.products[0].photo,
    });
  });

  it("sends the query text and page number in the request body", async () => {
    const query = `query-${Math.random().toString(36).slice(2)}`;
    const page = Math.floor(2 + Math.random() * 10);
    const requests = await withFakeFetch(
      { success: true, data: { pageCount: 0, itemCount: 0, products: [] }, messages: [] },
      async (requests) => {
        await new ProductSearch(new ShopApiClient(null)).run(query, page);
        return requests;
      },
    );
    expect(requests[0]?.body).toMatchObject({ search: query, page });
  });
});
