import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { isNotFound } from "./session-store.js";
import { Recipe } from "./types.js";

const DEFAULT_RECIPES_FILE = join(homedir(), ".yerevan-city-mcp", "recipes.json");

/**
 * Persists recipes the user liked to a file next to the login session, so
 * favorites survive MCP server restarts. Saves upsert by recipe name,
 * case-insensitively.
 */
export class RecipeStore {
  constructor(private readonly file: string = DEFAULT_RECIPES_FILE) {}

  async all(): Promise<Recipe[]> {
    try {
      const raw = await readFile(this.file, "utf8");
      return JSON.parse(raw) as Recipe[];
    } catch (error) {
      if (isNotFound(error)) return [];
      throw error;
    }
  }

  async save(recipe: Recipe): Promise<void> {
    const kept = (await this.all()).filter((entry) => !sameName(entry.name, recipe.name));
    kept.push(recipe);
    await this.write(kept);
  }

  /** Returns true when a recipe with that name existed and was removed. */
  async delete(name: string): Promise<boolean> {
    const recipes = await this.all();
    const kept = recipes.filter((entry) => !sameName(entry.name, name));
    if (kept.length === recipes.length) return false;
    await this.write(kept);
    return true;
  }

  private async write(recipes: Recipe[]): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true, mode: 0o700 });
    await writeFile(this.file, JSON.stringify(recipes, null, 2), { mode: 0o600 });
  }
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
