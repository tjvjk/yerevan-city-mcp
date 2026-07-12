import { describe, it, expect } from "vitest";
import { ShopApiClient, ShopApiError } from "../src/shop-api-client.js";
import { withFakeFetch } from "./fake-fetch.js";

describe("ShopApiClient", () => {
  it("returns the unwrapped data field on a successful response", async () => {
    const payload = { itemCount: Math.floor(Math.random() * 1000) };
    const data = await withFakeFetch({ success: true, data: payload, messages: [] }, () =>
      new ShopApiClient(null).get<typeof payload>("/api/Anything"),
    );
    expect(data).toEqual(payload);
  });

  it("throws a ShopApiError when the envelope reports failure", async () => {
    await expect(
      withFakeFetch({ success: false, data: null, messages: [{ key: 3, value: "Invalid Key" }] }, () =>
        new ShopApiClient(null).post("/api/Anything", {}),
      ),
    ).rejects.toThrow(ShopApiError);
  });

  it("sends an authorization header carrying the given token", async () => {
    const token = `token-${Math.random().toString(36).slice(2)}`;
    const requests = await withFakeFetch({ success: true, data: null, messages: [] }, async (requests) => {
      await new ShopApiClient(token).get("/api/Anything");
      return requests;
    });
    expect(requests[0]?.headers.authorization).toBe(`Bearer ${token}`);
  });

  it("omits the authorization header for an anonymous client", async () => {
    const requests = await withFakeFetch({ success: true, data: null, messages: [] }, async (requests) => {
      await new ShopApiClient(null).get("/api/Anything");
      return requests;
    });
    expect(requests[0]?.headers.authorization).toBeUndefined();
  });

  it("sends the given body as JSON on a POST call", async () => {
    const body = { search: `query-${Math.random().toString(36).slice(2)}` };
    const requests = await withFakeFetch({ success: true, data: null, messages: [] }, async (requests) => {
      await new ShopApiClient(null).post("/api/Anything", body);
      return requests;
    });
    expect(requests[0]?.body).toEqual(body);
  });
});
