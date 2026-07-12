export interface RecordedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

/**
 * Replaces globalThis.fetch for the duration of a test with a stub that
 * returns a fixed JSON body and records every call made through it. This
 * stands in for the real yerevan-city.am server at the network boundary,
 * rather than mocking any of our own classes or methods.
 */
export function withFakeFetch<T>(
  responseBody: unknown,
  run: (requests: RecordedRequest[]) => Promise<T>,
): Promise<T> {
  const requests: RecordedRequest[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL, init?: RequestInit) => {
    requests.push({
      url: String(input),
      method: init?.method ?? "GET",
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  return run(requests).finally(() => {
    globalThis.fetch = original;
  });
}
