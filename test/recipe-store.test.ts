import { describe, it, expect } from "vitest";
import { mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RecipeStore } from "../src/recipe-store.js";
import { Recipe } from "../src/types.js";

async function tempRecipesFile(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "yerevan-city-mcp-test-"));
  return join(dir, "nested", "recipes.json");
}

function randomRecipe(name?: string): Recipe {
  const suffix = Math.random().toString(36).slice(2);
  return {
    name: name ?? `recipe-${suffix}`,
    category: "Pasta",
    area: "Italian",
    ingredients: [{ name: `ingredient-${suffix}`, measure: "1 cup" }],
    instructions: `instructions-${suffix}`,
  };
}

describe("RecipeStore", () => {
  it("returns an empty list when nothing was ever saved", async () => {
    const store = new RecipeStore(await tempRecipesFile());
    expect(await store.all()).toEqual([]);
  });

  it("returns previously saved recipes unchanged", async () => {
    const store = new RecipeStore(await tempRecipesFile());
    const first = randomRecipe();
    const second = randomRecipe();
    await store.save(first);
    await store.save(second);
    expect(await store.all()).toEqual([first, second]);
  });

  it("overwrites a recipe with the same name, ignoring case", async () => {
    const store = new RecipeStore(await tempRecipesFile());
    await store.save(randomRecipe("Carbonara"));
    const updated = randomRecipe("carbonara");
    await store.save(updated);
    expect(await store.all()).toEqual([updated]);
  });

  it("deletes a saved recipe by name and reports whether it existed", async () => {
    const store = new RecipeStore(await tempRecipesFile());
    const recipe = randomRecipe();
    await store.save(recipe);
    expect(await store.delete(recipe.name.toUpperCase())).toBe(true);
    expect(await store.all()).toEqual([]);
    expect(await store.delete(recipe.name)).toBe(false);
  });

  it("creates the recipes file with permissions restricted to the owner", async () => {
    const file = await tempRecipesFile();
    const store = new RecipeStore(file);
    await store.save(randomRecipe());
    const mode = (await stat(file)).mode & 0o777;
    expect(mode).toBe(0o600);
  });
});
