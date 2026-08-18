import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Auth } from "../src/auth.js";
import { SessionStore } from "../src/session-store.js";
import { withFakeFetchByEndpoint } from "./fake-fetch.js";

async function tempSessionFile(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "yerevan-city-mcp-test-"));
  return join(dir, "session.json");
}

async function sendCodeConfirmCode(
  challengeAsString: string,
): Promise<unknown> {
  const requests = await withFakeFetchByEndpoint(
    (url) => ({
      success: true,
      data: url.endsWith("/api/Sms/ConfirmCode") ? challengeAsString : true,
      messages: [],
    }),
    async (requests) => {
      const auth = new Auth(new SessionStore(await tempSessionFile()));
      await auth.requestCode("+37499900011");
      return requests;
    },
  );
  const sendCode = requests.find((request) =>
    request.url.endsWith("/api/Sms/SendCode"),
  );
  return (sendCode?.body as { confirmCode?: unknown })?.confirmCode;
}

describe("Auth.requestCode", () => {
  it("solves the ConfirmCode challenge exactly as observed from the live site", async () => {
    const confirmCode = await sendCodeConfirmCode("502538");
    expect(
      confirmCode,
      "did not reproduce the site's own challenge answer",
    ).toBe("125597");
  });

  it("drops the fractional remainder left by the challenge formula", async () => {
    const challenge = Math.floor(100000 + Math.random() * 800000);
    const exact = (2 * challenge + 17) / 8 - 39;
    const confirmCode = await sendCodeConfirmCode(String(challenge));
    expect(
      confirmCode,
      "did not truncate the fractional challenge result",
    ).toBe(String(Math.trunc(exact)));
  });

  it("sends confirmCode as a JSON string rather than a number", async () => {
    const challenge = Math.floor(100000 + Math.random() * 800000);
    const confirmCode = await sendCodeConfirmCode(String(challenge));
    expect(typeof confirmCode, "sent confirmCode as a non-string type").toBe(
      "string",
    );
  });
});
