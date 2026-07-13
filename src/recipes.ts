import { Recipe, RecipeIngredient } from "./types.js";

const MEALDB_SEARCH_URL = "https://www.themealdb.com/api/json/v1/1/search.php";
const MEALDB_FILTER_URL = "https://www.themealdb.com/api/json/v1/1/filter.php";

interface RawMeal {
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  [slot: string]: string | null;
}

/**
 * Searches TheMealDB — a free, no-API-key, English recipe database — by dish
 * name. Instructions are omitted by default to keep responses small; the
 * ingredient list with measures is what the shopping flow needs.
 */
// ponytail: TheMealDB has ~300 recipes; swap to Spoonacular (API key) if coverage falls short.
export async function searchRecipes(
  query: string,
  includeInstructions: boolean,
): Promise<Recipe[]> {
  const response = await fetch(`${MEALDB_SEARCH_URL}?s=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`TheMealDB request failed with HTTP ${response.status}`);
  }
  const raw = (await response.json()) as { meals: RawMeal[] | null };
  return (raw.meals ?? []).map((meal) => toRecipe(meal, includeInstructions));
}

/**
 * Lists the names of TheMealDB recipes that feature one main ingredient
 * (e.g. "chicken", "chicken breast"). Names only — fetch details with
 * searchRecipes. TheMealDB expects underscores for spaces in ingredients.
 */
export async function suggestRecipes(ingredient: string): Promise<string[]> {
  const slug = ingredient.trim().replace(/\s+/g, "_");
  const response = await fetch(`${MEALDB_FILTER_URL}?i=${encodeURIComponent(slug)}`);
  if (!response.ok) {
    throw new Error(`TheMealDB request failed with HTTP ${response.status}`);
  }
  const raw = (await response.json()) as { meals: { strMeal: string }[] | null };
  return (raw.meals ?? []).map((meal) => meal.strMeal);
}

function toRecipe(meal: RawMeal, includeInstructions: boolean): Recipe {
  const recipe: Recipe = {
    name: meal.strMeal,
    category: meal.strCategory,
    area: meal.strArea,
    ingredients: toIngredients(meal),
  };
  if (includeInstructions) recipe.instructions = meal.strInstructions;
  return recipe;
}

function toIngredients(meal: RawMeal): RecipeIngredient[] {
  const ingredients: RecipeIngredient[] = [];
  for (let slot = 1; slot <= 20; slot++) {
    const name = (meal[`strIngredient${slot}`] ?? "").trim();
    if (!name) continue;
    ingredients.push({ name, measure: (meal[`strMeasure${slot}`] ?? "").trim() });
  }
  return ingredients;
}
