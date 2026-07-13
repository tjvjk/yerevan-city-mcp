import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Auth } from "./auth.js";
import { AuthenticatedClient } from "./authenticated-client.js";
import { Addresses } from "./addresses.js";
import { ProductSearch } from "./products.js";
import { ShopCart } from "./cart.js";
import { SessionStore } from "./session-store.js";
import { searchRecipes, suggestRecipes } from "./recipes.js";
import { RecipeStore } from "./recipe-store.js";

/**
 * Builds the yerevan-city.am MCP server: registers every tool against a
 * single shared SessionStore so login persists across tool calls and
 * process restarts.
 */
export function buildServer(): McpServer {
  const sessions = new SessionStore();
  const auth = new Auth(sessions);
  const authenticated = new AuthenticatedClient(sessions);
  const savedRecipes = new RecipeStore();

  const server = new McpServer({
    name: "yerevan-city-mcp",
    version: "1.0.0",
  });

  server.registerTool(
    "request_login_code",
    {
      description:
        "Send a login SMS code to a phone number on yerevan-city.am. Call confirm_login_code next with the code the user receives.",
      inputSchema: {
        phone: z.string().describe("Armenian phone number, e.g. +37441234567"),
      },
    },
    async ({ phone }) => {
      await auth.requestCode(phone);
      return textResult(`SMS code sent to ${phone}, ask the user for the code and call confirm_login_code`);
    },
  );

  server.registerTool(
    "confirm_login_code",
    {
      description: "Complete login with the SMS code received after request_login_code.",
      inputSchema: {
        phone: z.string().describe("Same Armenian phone number passed to request_login_code"),
        code: z.string().describe("Numeric code received by SMS"),
      },
    },
    async ({ phone, code }) => {
      await auth.confirmCode(phone, code);
      return textResult("Logged in, session saved for future tool calls");
    },
  );

  server.registerTool(
    "search_products",
    {
      description: "Search the yerevan-city.am product catalogue by free-text query. Requires login.",
      inputSchema: {
        query: z.string().describe("Search text, e.g. a product name"),
        page: z.number().int().min(1).default(1),
      },
    },
    async ({ query, page }) => {
      const client = await authenticated.client();
      const result = await new ProductSearch(client).run(query, page);
      return textResult(JSON.stringify(result, null, 2));
    },
  );

  server.registerTool(
    "list_addresses",
    {
      description:
        "List the delivery addresses saved on the logged-in user's account. Needed to pick an addressId for add_to_cart.",
      inputSchema: {},
    },
    async () => {
      const client = await authenticated.client();
      const addresses = await new Addresses(client).all();
      return textResult(JSON.stringify(addresses, null, 2));
    },
  );

  server.registerTool(
    "add_to_cart",
    {
      description:
        "Add a product to the yerevan-city.am cart, either by piece count or by weight in grams. Never places an order or pays — only builds the cart for the user to check out themselves. " +
        "After adding, always check the returned addedItem: yerevan-city.am accepts the add call even for products that are out of stock at the delivery address, and only reports that via isMissing/availableCount/availableWeight on the item that comes back. " +
        "If isMissing is true, the product was NOT actually added despite the successful call — immediately call remove_from_cart for this productId so it doesn't sit in the cart unusable, then tell the user it's unavailable (mention availableCount/availableWeight if partial stock exists) and, if there's an obvious alternative from search_products, ask whether to add that instead. Do not leave an out-of-stock item in the cart and move on silently. " +
        "Also report totalPrice and deliveryFee from the response to the user as the current cart total including delivery — don't just say the item was added without stating the running total.",
      inputSchema: {
        productId: z.number().int().describe("Product id from search_products"),
        count: z.number().int().min(1).optional().describe("Number of pieces, for piece-counted products"),
        grams: z.number().int().min(1).optional().describe("Weight in grams, for weight-based products"),
        addressId: z.number().int().optional().describe("Delivery address id from list_addresses, defaults to the account's default address"),
      },
    },
    async ({ productId, count, grams, addressId }) => {
      const client = await authenticated.client();
      const session = await authenticated.session();
      const cart = new ShopCart(client, session);
      if (grams !== undefined) await cart.addByWeight(productId, grams, addressId);
      else if (count !== undefined) await cart.addByCount(productId, count, addressId);
      else throw new Error("Either count or grams must be provided");
      const contents = await cart.contents(addressId);
      const addedItem = contents.items.find((entry) => entry.id === productId);
      return textResult(
        JSON.stringify(
          {
            addedItem: addedItem ?? { id: productId, isMissing: true },
            totalPrice: contents.totalPrice,
            deliveryFee: contents.deliveryFee,
          },
          null,
          2,
        ),
      );
    },
  );

  server.registerTool(
    "remove_from_cart",
    {
      description:
        "Remove a product from the yerevan-city.am cart. Also use this to clean up any item that get_cart or add_to_cart reported as isMissing (out of stock) — a missing item never gets delivered, so it should not be left sitting in the cart.",
      inputSchema: {
        productId: z.number().int().describe("Product id to remove"),
        addressId: z.number().int().optional().describe("Delivery address id, defaults to the account's default address"),
      },
    },
    async ({ productId, addressId }) => {
      const client = await authenticated.client();
      const session = await authenticated.session();
      await new ShopCart(client, session).remove(productId, addressId);
      return textResult("Removed from cart");
    },
  );

  server.registerTool(
    "get_cart",
    {
      description:
        "Show the current yerevan-city.am cart contents and total price. Does not place an order. " +
        "Check each item's isMissing field before telling the user their cart is ready — a missing item stays in the cart but cannot actually be delivered (see availableCount/availableWeight for what's actually in stock). " +
        "If any item has isMissing true, call remove_from_cart for it before reporting the cart as done — don't just mention it and leave it there. " +
        "Always state totalPrice and deliveryFee together as the full amount the user will pay, including delivery.",
      inputSchema: {
        addressId: z.number().int().optional().describe("Delivery address id from list_addresses, defaults to the account's default address"),
      },
    },
    async ({ addressId }) => {
      const client = await authenticated.client();
      const session = await authenticated.session();
      const cart = await new ShopCart(client, session).contents(addressId);
      return textResult(JSON.stringify(cart, null, 2));
    },
  );

  server.registerTool(
    "get_recipe",
    {
      description:
        "Look up recipes by dish name in TheMealDB (free English recipe database) and return each match's ingredient list with measures. No login needed. " +
        "If several recipes match, show the user the names and let them pick one before touching the cart. " +
        "If nothing matches, retry once with a simpler, more canonical dish name (e.g. 'bolognese' instead of 'pasta with beef'). If the database still has nothing, do not stop: the database only holds a few hundred dishes, so write the standard ingredient list with measures from your own knowledge, tell the user it came from you rather than the database, and continue the same shopping flow; offer save_recipe so the dish is available next time. " +
        "To shop for a recipe: for each ingredient call search_products with a simplified product term (e.g. 'Tomato Puree' -> 'tomato paste', 'Minced Beef' -> 'ground beef'), then add_to_cart the best match sized to the recipe's measure. " +
        "Skip pantry staples the user almost certainly has (salt, pepper, water) but say which were skipped. If an ingredient has no matching product, report it instead of silently dropping it. Finish by stating the cart total.",
      inputSchema: {
        query: z.string().describe("Dish name, e.g. 'carbonara'"),
        includeInstructions: z
          .boolean()
          .default(false)
          .describe("Set true to also return cooking instructions (longer response)"),
      },
    },
    async ({ query, includeInstructions }) => {
      const recipes = await searchRecipes(query, includeInstructions);
      if (recipes.length === 0) return textResult(`No recipes found for "${query}"`);
      return textResult(JSON.stringify(recipes, null, 2));
    },
  );

  server.registerTool(
    "suggest_recipes",
    {
      description:
        "Suggest dishes that feature one main ingredient (e.g. 'chicken', 'salmon', 'chicken breast'), from TheMealDB. Returns dish names only, so it's cheap to call. No login needed. " +
        "Use this when the user asks what to cook with an ingredient rather than naming a dish. For extra wishes like 'with vegetables', pick the suggestions that fit (use your knowledge of the dishes, or check candidates with get_recipe) and offer the user a short shortlist. " +
        "If nothing comes back, try a more specific form of the ingredient ('minced beef', 'chicken breast') — and if the database still has nothing, suggest fitting dishes from your own knowledge instead and say so. " +
        "Once the user picks a dish, continue with get_recipe and the usual shopping flow.",
      inputSchema: {
        ingredient: z.string().describe("One main ingredient in English, e.g. 'chicken'"),
      },
    },
    async ({ ingredient }) => {
      const names = await suggestRecipes(ingredient);
      if (names.length === 0) return textResult(`No recipes found featuring "${ingredient}"`);
      return textResult(JSON.stringify(names, null, 2));
    },
  );

  server.registerTool(
    "save_recipe",
    {
      description:
        "Save a recipe the user liked so it can be cooked again later. Pass the recipe as returned by get_recipe, with any tweaks the user asked for, and include the instructions when available (fetch them with get_recipe includeInstructions=true if missing). Overwrites a previously saved recipe with the same name.",
      inputSchema: {
        name: z.string().describe("Recipe name"),
        category: z.string().default("").describe("e.g. 'Pasta'"),
        area: z.string().default("").describe("Cuisine, e.g. 'Italian'"),
        ingredients: z
          .array(z.object({ name: z.string(), measure: z.string() }))
          .describe("Ingredient list with measures"),
        instructions: z.string().optional().describe("Cooking instructions"),
      },
    },
    async ({ name, category, area, ingredients, instructions }) => {
      await savedRecipes.save({ name, category, area, ingredients, instructions });
      return textResult(`Saved recipe "${name}"`);
    },
  );

  server.registerTool(
    "list_saved_recipes",
    {
      description:
        "List the recipes the user saved earlier. Check here first when the user refers to a saved or favorite recipe (e.g. 'my carbonara', 'the usual'), then shop for its ingredients the same way as with get_recipe: search_products per ingredient, add_to_cart, skip stated pantry staples, and finish with the cart total.",
      inputSchema: {},
    },
    async () => {
      const recipes = await savedRecipes.all();
      if (recipes.length === 0) return textResult("No saved recipes yet");
      return textResult(JSON.stringify(recipes, null, 2));
    },
  );

  server.registerTool(
    "delete_saved_recipe",
    {
      description: "Delete a previously saved recipe by name.",
      inputSchema: {
        name: z.string().describe("Name of the saved recipe to delete"),
      },
    },
    async ({ name }) => {
      const removed = await savedRecipes.delete(name);
      return textResult(removed ? `Deleted saved recipe "${name}"` : `No saved recipe named "${name}"`);
    },
  );

  return server;
}

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}
