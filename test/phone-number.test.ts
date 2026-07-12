import { describe, it, expect } from "vitest";
import { internationalNumber, nationalNumber } from "../src/phone-number.js";

describe("nationalNumber", () => {
  it("strips the +374 country code and non-digit characters", () => {
    expect(nationalNumber("+374 41 919013")).toBe("41919013");
  });

  it("passes through a number that already has no country code", () => {
    expect(nationalNumber("41919013")).toBe("41919013");
  });

  it("strips a country code given without a leading plus", () => {
    expect(nationalNumber("37441919013")).toBe("41919013");
  });
});

describe("internationalNumber", () => {
  it("adds a +374 prefix to a bare national number", () => {
    expect(internationalNumber("41919013")).toBe("+37441919013");
  });

  it("normalizes a number that already has the country code", () => {
    expect(internationalNumber("+37441919013")).toBe("+37441919013");
  });

  it("normalizes a number with stray formatting characters", () => {
    expect(internationalNumber("374 41-919-013")).toBe("+37441919013");
  });
});
