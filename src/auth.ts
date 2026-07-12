import { ShopApiClient } from "./shop-api-client.js";
import { SessionStore } from "./session-store.js";
import { internationalNumber, nationalNumber } from "./phone-number.js";

interface VerifyResponse {
  id: string;
  name: string;
  surname: string;
  accessToken: string;
}

/**
 * Drives the phone + SMS login flow against yerevan-city.am and persists the
 * resulting session. The site's own login form calls ConfirmCode right
 * before SendCode on every attempt, so we mirror that even though its
 * purpose (anti-bot guard) is not fully understood.
 */
export class Auth {
  constructor(private readonly sessions: SessionStore) {}

  async requestCode(phone: string): Promise<void> {
    const anonymous = new ShopApiClient(null);
    await anonymous.post<string>("/api/Sms/ConfirmCode", {});
    await anonymous.post<boolean>("/api/Sms/SendCode", {
      phoneNumber: nationalNumber(phone),
      country: "AM",
      deviceId: deviceId(),
      osType: 3,
      confirmCode: "",
    });
  }

  async confirmCode(phone: string, code: string): Promise<void> {
    const anonymous = new ShopApiClient(null);
    const result = await anonymous.post<VerifyResponse>("/api/Sms/Verify", {
      phoneNumber: internationalNumber(phone),
      code,
    });
    await this.sessions.save({
      userToken: result.accessToken,
      phone: internationalNumber(phone),
      name: result.name,
      surname: result.surname,
      addressId: null,
      lat: null,
      lng: null,
    });
  }
}

function deviceId(): string {
  return `${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
}
