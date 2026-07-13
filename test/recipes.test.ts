import { describe, it, expect } from "vitest";
import { searchRecipes, suggestRecipes } from "../src/recipes.js";
import { withFakeFetch } from "./fake-fetch.js";

function rawMeal() {
  return {
    idMeal: "52771",
    strMeal: "Spicy Arrabiata Penne",
    strCategory: "Vegetarian",
    strArea: "Italian",
    strInstructions: "Bring a large pot of water to a boil...",
    strIngredient1: "penne rigate",
    strMeasure1: "1 pound",
    strIngredient2: "olive oil",
    strMeasure2: "1/4 cup",
    strIngredient3: "garlic",
    strMeasure3: "3 cloves",
    strIngredient4: "",
    strMeasure4: " ",
    strIngredient5: null,
    strMeasure5: null,
  };
}

describe("searchRecipes", () => {
  it("maps a raw meal to a compact recipe without instructions by default", async () => {
    const recipes = await withFakeFetch({ meals: [rawMeal()] }, () =>
      searchRecipes("arrabiata", false),
    );
    expect(recipes).toEqual([
      {
        name: "Spicy Arrabiata Penne",
        category: "Vegetarian",
        area: "Italian",
        ingredients: [
          { name: "penne rigate", measure: "1 pound" },
          { name: "olive oil", measure: "1/4 cup" },
          { name: "garlic", measure: "3 cloves" },
        ],
      },
    ]);
  });

  it("includes instructions when requested", async () => {
    const recipes = await withFakeFetch({ meals: [rawMeal()] }, () =>
      searchRecipes("arrabiata", true),
    );
    expect(recipes[0]?.instructions).toBe("Bring a large pot of water to a boil...");
  });

  it("returns an empty list when TheMealDB finds nothing", async () => {
    const recipes = await withFakeFetch({ meals: null }, () => searchRecipes("nonsense", false));
    expect(recipes).toEqual([]);
  });

  it("sends the query URL-encoded to TheMealDB", async () => {
    const requests = await withFakeFetch({ meals: null }, async (requests) => {
      await searchRecipes("pasta & sauce", false);
      return requests;
    });
    expect(requests[0]?.url).toBe(
      "https://www.themealdb.com/api/json/v1/1/search.php?s=pasta%20%26%20sauce",
    );
  });
});

describe("suggestRecipes", () => {
  it("returns the dish names for an ingredient", async () => {
    const meals = [{ strMeal: "Brown Stew Chicken" }, { strMeal: "Chicken Handi" }];
    const names = await withFakeFetch({ meals }, () => suggestRecipes("chicken"));
    expect(names).toEqual(["Brown Stew Chicken", "Chicken Handi"]);
  });

  it("returns an empty list when nothing features the ingredient", async () => {
    const names = await withFakeFetch({ meals: null }, () => suggestRecipes("nonsense"));
    expect(names).toEqual([]);
  });

  it("converts ingredient spaces to underscores, as TheMealDB expects", async () => {
    const requests = await withFakeFetch({ meals: null }, async (requests) => {
      await suggestRecipes("chicken breast");
      return requests;
    });
    expect(requests[0]?.url).toBe(
      "https://www.themealdb.com/api/json/v1/1/filter.php?i=chicken_breast",
    );
  });
});
