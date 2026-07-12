import { describe, it, expect } from "vitest";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stat } from "node:fs/promises";
import { SessionStore, StoredSession } from "../src/session-store.js";

async function tempSessionFile(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "yerevan-city-mcp-test-"));
  return join(dir, "nested", "session.json");
}

function randomSession(): StoredSession {
  const suffix = Math.random().toString(36).slice(2);
  return {
    userToken: `token-${suffix}`,
    phone: `+374${Math.floor(10000000 + Math.random() * 89999999)}`,
    name: `name-${suffix}`,
    surname: `surname-${suffix}`,
    addressId: Math.floor(Math.random() * 1000000),
    lat: Math.random() * 90,
    lng: Math.random() * 90,
  };
}

describe("SessionStore", () => {
  it("returns null when no session was ever saved", async () => {
    const store = new SessionStore(await tempSessionFile());
    expect(await store.load()).toBeNull();
  });

  it("returns a previously saved session unchanged", async () => {
    const store = new SessionStore(await tempSessionFile());
    const session = randomSession();
    await store.save(session);
    expect(await store.load()).toEqual(session);
  });

  it("returns null after clearing a saved session", async () => {
    const store = new SessionStore(await tempSessionFile());
    await store.save(randomSession());
    await store.clear();
    expect(await store.load()).toBeNull();
  });

  it("creates the session file with permissions restricted to the owner", async () => {
    const file = await tempSessionFile();
    const store = new SessionStore(file);
    await store.save(randomSession());
    const mode = (await stat(file)).mode & 0o777;
    expect(mode).toBe(0o600);
  });
});
