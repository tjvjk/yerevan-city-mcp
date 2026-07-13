import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface StoredSession {
  userToken: string;
  phone: string;
  name: string;
  surname: string;
  addressId: number | null;
  lat: number | null;
  lng: number | null;
}

const DEFAULT_SESSION_FILE = join(homedir(), ".yerevan-city-mcp", "session.json");

/**
 * Persists the logged-in user's session (JWT + default address) to a file,
 * defaulting to the user's home directory so login survives across MCP
 * server restarts.
 */
export class SessionStore {
  constructor(private readonly file: string = DEFAULT_SESSION_FILE) {}

  async load(): Promise<StoredSession | null> {
    try {
      const raw = await readFile(this.file, "utf8");
      return JSON.parse(raw) as StoredSession;
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  async save(session: StoredSession): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true, mode: 0o700 });
    await writeFile(this.file, JSON.stringify(session, null, 2), {
      mode: 0o600,
    });
  }

  async clear(): Promise<void> {
    await writeFile(this.file, JSON.stringify(null), { mode: 0o600 });
  }
}

export function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
