import { describe, it, expect } from "vitest";
import { internationalNumber, nationalNumber } from "../src/phone-number.js";

describe("nationalNumber", () => {
  it("strips the +374 country code and non-digit characters", () => {
    expect(nationalNumber("+374 99 900011")).toBe("99900011");
  });

  it("passes through a number that already has no country code", () => {
    expect(nationalNumber("99900011")).toBe("99900011");
  });

  it("strips a country code given without a leading plus", () => {
    expect(nationalNumber("37499900011")).toBe("99900011");
  });
});

describe("internationalNumber", () => {
  it("adds a +374 prefix to a bare national number", () => {
    expect(internationalNumber("99900011")).toBe("+37499900011");
  });

  it("normalizes a number that already has the country code", () => {
    expect(internationalNumber("+37499900011")).toBe("+37499900011");
  });

  it("normalizes a number with stray formatting characters", () => {
    expect(internationalNumber("374 99-900-011")).toBe("+37499900011");
  });
});
