import { describe, it, expect } from "vitest";
import { ShopApiClient } from "../src/shop-api-client.js";
import { ShopCart, NoDeliveryAddressError } from "../src/cart.js";
import { StoredSession } from "../src/session-store.js";
import { withFakeFetch } from "./fake-fetch.js";

function randomSession(overrides: Partial<StoredSession> = {}): StoredSession {
  return {
    userToken: `token-${Math.random().toString(36).slice(2)}`,
    phone: "+37441919013",
    name: "Dmitriy",
    surname: "Miroshnichenko",
    addressId: Math.floor(Math.random() * 1000000),
    lat: 40.178490,
    lng: 44.509726,
    ...overrides,
  };
}

describe("ShopCart.addByWeight", () => {
  it("sends the gram amount as both weight and quantity", async () => {
    const productId = Math.floor(Math.random() * 1000000);
    const grams = Math.floor(500 + Math.random() * 2000);
    const requests = await withFakeFetch({ success: true, data: true, messages: [] }, async (requests) => {
      const cart = new ShopCart(new ShopApiClient(null), randomSession());
      await cart.addByWeight(productId, grams);
      return requests;
    });
    expect(requests[0]?.body).toMatchObject({ id: productId, weight: grams, quantity: grams });
  });
});

describe("ShopCart.addByCount", () => {
  it("sends the piece count as quantity with weight at zero", async () => {
    const productId = Math.floor(Math.random() * 1000000);
    const count = Math.floor(1 + Math.random() * 10);
    const requests = await withFakeFetch({ success: true, data: true, messages: [] }, async (requests) => {
      const cart = new ShopCart(new ShopApiClient(null), randomSession());
      await cart.addByCount(productId, count);
      return requests;
    });
    expect(requests[0]?.body).toMatchObject({ id: productId, weight: 0, quantity: count });
  });

  it("uses the explicitly given addressId over the session default", async () => {
    const explicitAddressId = Math.floor(Math.random() * 1000000);
    const requests = await withFakeFetch({ success: true, data: true, messages: [] }, async (requests) => {
      const cart = new ShopCart(new ShopApiClient(null), randomSession());
      await cart.addByCount(1, 1, explicitAddressId);
      return requests;
    });
    expect(requests[0]?.body).toMatchObject({ addressId: explicitAddressId });
  });

  it("throws NoDeliveryAddressError when neither an explicit nor a session address is available", async () => {
    const cart = new ShopCart(new ShopApiClient(null), randomSession({ addressId: null }));
    await expect(cart.addByCount(1, 1)).rejects.toThrow(NoDeliveryAddressError);
  });
});

describe("ShopCart.remove", () => {
  it("sends zero for both weight and quantity", async () => {
    const productId = Math.floor(Math.random() * 1000000);
    const requests = await withFakeFetch({ success: true, data: true, messages: [] }, async (requests) => {
      const cart = new ShopCart(new ShopApiClient(null), randomSession());
      await cart.remove(productId);
      return requests;
    });
    expect(requests[0]?.body).toMatchObject({ id: productId, weight: 0, quantity: 0 });
  });
});

describe("ShopCart.contents", () => {
  it("excludes auto-added packaging bag line items", async () => {
    const raw = {
      totalPrice: 802.5,
      deliveryFee: 0,
      items: [
        { id: 1, name: "Banana Sabrostar kg", price: 802.5, count: 0, weight: 1500, isKilogram: true, isBag: false },
        { id: 2, name: 'Polyethylene pack "Yerevan City"', price: 50, count: 1, weight: 0, isKilogram: false, isBag: true },
      ],
      cartUserAddress: null,
    };
    const cart = await withFakeFetch({ success: true, data: raw, messages: [] }, () =>
      new ShopCart(new ShopApiClient(null), randomSession()).contents(),
    );
    expect(cart.items).toEqual([
      { id: 1, name: "Banana Sabrostar kg", price: 802.5, count: 0, weight: 1500, isKilogram: true, isBag: false },
    ]);
  });

  it("returns an empty item list when the cart has no items yet", async () => {
    const raw = { totalPrice: 0, deliveryFee: 0, items: null, cartUserAddress: null };
    const cart = await withFakeFetch({ success: true, data: raw, messages: [] }, () =>
      new ShopCart(new ShopApiClient(null), randomSession()).contents(),
    );
    expect(cart.items).toEqual([]);
  });
});
