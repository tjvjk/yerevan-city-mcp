import { describe, it, expect } from "vitest";
import { ShopApiClient } from "../src/shop-api-client.js";
import { Addresses } from "../src/addresses.js";
import { withFakeFetch } from "./fake-fetch.js";

describe("Addresses", () => {
  it("unwraps the addresses array and maps every field", async () => {
    const id = Math.floor(Math.random() * 1000000);
    const raw = {
      addresses: [
        {
          id,
          lat: 40.178490,
          lng: 44.509726,
          street: "Երևան, Զաքյան 3",
          city: "Երևան",
          title: "տուն",
          isDefault: true,
          buliding: "3",
          entrance: 2,
          floor: 5,
          appartment: 69,
          phoneNumber: null,
          commentToDriver: null,
        },
      ],
    };
    const addresses = await withFakeFetch({ success: true, data: raw, messages: [] }, () =>
      new Addresses(new ShopApiClient(null)).all(),
    );
    expect(addresses).toEqual([
      { id, lat: raw.addresses[0].lat, lng: raw.addresses[0].lng, street: raw.addresses[0].street, city: raw.addresses[0].city, title: "տուն", isDefault: true },
    ]);
  });

  it("returns an empty list when the account has no saved addresses", async () => {
    const addresses = await withFakeFetch({ success: true, data: { addresses: [] }, messages: [] }, () =>
      new Addresses(new ShopApiClient(null)).all(),
    );
    expect(addresses).toEqual([]);
  });
});
