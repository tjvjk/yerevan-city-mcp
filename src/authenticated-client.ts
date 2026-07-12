import { SessionStore, StoredSession } from "./session-store.js";
import { ShopApiClient } from "./shop-api-client.js";

export class NotLoggedInError extends Error {
  constructor() {
    super(
      "No active yerevan-city.am session, call request_login_code then confirm_login_code first",
    );
  }
}

/**
 * Produces a ShopApiClient bound to the currently persisted user session,
 * refusing to proceed when no one is logged in yet.
 */
export class AuthenticatedClient {
  constructor(private readonly sessions: SessionStore) {}

  async client(): Promise<ShopApiClient> {
    const session = await this.session();
    return new ShopApiClient(session.userToken);
  }

  async session(): Promise<StoredSession> {
    const session = await this.sessions.load();
    if (session === null) throw new NotLoggedInError();
    return session;
  }
}
