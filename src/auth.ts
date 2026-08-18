import { internationalNumber, nationalNumber } from "./phone-number.js";
import type { SessionStore } from "./session-store.js";
import { ShopApiClient } from "./shop-api-client.js";

interface VerifyResponse {
  id: string;
  name: string;
  surname: string;
  accessToken: string;
}

/**
 * Drives the phone + SMS login flow against yerevan-city.am and persists the
 * resulting session. ConfirmCode is an anti-bot challenge: it returns a
 * number that must be solved with the site's own transformation and echoed
 * back in SendCode, or the API silently accepts the request without ever
 * sending the SMS.
 */
export class Auth {
  constructor(private readonly sessions: SessionStore) {}

  async requestCode(phone: string): Promise<void> {
    const anonymous = new ShopApiClient(null);
    const challenge = await anonymous.post<string>("/api/Sms/ConfirmCode", {});
    await anonymous.post<boolean>("/api/Sms/SendCode", {
      phoneNumber: nationalNumber(phone),
      country: "AM",
      deviceId: deviceId(),
      osType: 3,
      confirmCode: solveConfirmChallenge(Number(challenge)),
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

function solveConfirmChallenge(challenge: number): string {
  return String(Math.trunc((2 * challenge + 17) / 8 - 39));
}
