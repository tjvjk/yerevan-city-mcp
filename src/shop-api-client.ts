const API_BASE = "https://apishopv2.yerevan-city.am";

export class ShopApiError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`yerevan-city.am API call to ${endpoint} failed with status ${status}: ${body}`);
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  messages: { key: number; value: string }[];
}

/**
 * Thin wrapper around fetch that knows the yerevan-city.am shop API's base
 * URL, required headers, and response envelope shape. Callers pass an
 * optional bearer token; without one, calls run as an anonymous visitor.
 */
export class ShopApiClient {
  constructor(private readonly token: string | null) {}

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.send<T>(endpoint, "POST", body);
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.send<T>(endpoint, "GET", undefined);
  }

  private async send<T>(
    endpoint: string,
    method: "GET" | "POST",
    body: unknown,
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: this.headers(),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    if (!response.ok) throw new ShopApiError(endpoint, response.status, text);
    const envelope = JSON.parse(text) as ApiEnvelope<T>;
    if (!envelope.success) {
      const message = envelope.messages.map((m) => m.value).join("; ");
      throw new ShopApiError(endpoint, response.status, message || "API reported failure");
    }
    return envelope.data;
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      accept: "application/json",
      "content-type": "application/json",
      "content-language": "3",
      ostype: "3",
      cityid: "",
    };
    if (this.token !== null) headers.authorization = `Bearer ${this.token}`;
    return headers;
  }
}
