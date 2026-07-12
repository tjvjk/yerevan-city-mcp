/**
 * Normalizes an Armenian phone number to the national form the SendCode
 * endpoint expects: digits only, no country code, no leading zero.
 */
export function nationalNumber(phone: string): string {
  return phone.replace(/^\+?374/, "").replace(/\D/g, "");
}

/**
 * Normalizes an Armenian phone number to the international form the Verify
 * endpoint expects: a leading "+374" followed by the national digits.
 */
export function internationalNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^374/, "");
  return `+374${digits}`;
}
