# yerevan-city-mcp

![Demo](files/yerevan-city-mcp-demo.gif)

Order groceries from [yerevan-city.am](https://yerevan-city.am) right from a
conversation with your AI assistant. Just say what you need — the agent finds
the products and builds the cart for you.

Set up once (you only need to confirm your phone number by SMS) and it keeps
working after that — no need to open the site and search for products by
hand.

**Safe by design**: the agent never pays or places an order — it only builds
the cart. Checkout and payment always stay with you, in your own browser or
app.

## What the agent can do

- Search products by name
- Show your saved delivery addresses
- Add and remove products from the cart
- Show the cart contents and total price
- Look up a recipe and shop for its ingredients — try *"Get the recipe for
  chicken alfredo and add the ingredients to my cart"*
- Get dish ideas from an ingredient — *"What can I cook with chicken and
  vegetables?"*
- Keep your favorites — *"That was great, save this recipe"*, then later
  *"Cook my saved carbonara"*

## Installation

1. Download this folder and build the project:

   ```bash
   npm install
   npm run build
   ```

2. Connect the server in your AI assistant's settings.

   **Claude Code** — run in a terminal:

   ```bash
   claude mcp add yerevan-city -- node /full/path/to/dist/index.js
   ```

   **Claude Desktop** — open the MCP server config file
   (Settings → Developer → Edit Config) and add:

   ```json
   {
     "mcpServers": {
       "yerevan-city": {
         "command": "node",
         "args": ["/full/path/to/dist/index.js"]
       }
     }
   }
   ```

   Restart the app after saving.

   **Codex CLI** — run in a terminal:

   ```bash
   codex mcp add yerevan-city -- node /full/path/to/dist/index.js
   ```

   Or add it directly to `~/.codex/config.toml`:

   ```toml
   [mcp_servers.yerevan-city]
   command = "node"
   args = ["/full/path/to/dist/index.js"]
   ```

   **opencode** — add it to `opencode.json`:

   ```json
   {
     "mcp": {
       "yerevan-city": {
         "type": "local",
         "command": ["node", "/full/path/to/dist/index.js"],
         "enabled": true
       }
     }
   }
   ```

   **Antigravity** — open the MCP store from the editor's agent panel,
   select "Manage MCP Servers" → "View raw config", and add to
   `~/.gemini/config/mcp_config.json`:

   ```json
   {
     "mcpServers": {
       "yerevan-city": {
         "command": "node",
         "args": ["/full/path/to/dist/index.js"]
       }
     }
   }
   ```

3. Done. Tell the assistant something like "order milk and bread" — the
   first time it touches the cart it will ask you to confirm your phone
   number by SMS, and it stays logged in after that.

## Technical details

Login is a one-time phone + SMS step; the session is then cached locally so
it keeps working across restarts.

### Tools

- `request_login_code` / `confirm_login_code` — one-time phone + SMS login
- `search_products` — free-text product search
- `list_addresses` — the account's saved delivery addresses
- `add_to_cart` / `remove_from_cart` — build the cart, by piece count or by weight
- `get_cart` — current cart contents and total price
- `get_recipe` — look up a recipe (ingredients + measures) by dish name, via
  the free English [TheMealDB](https://www.themealdb.com) API; no login needed
- `suggest_recipes` — list dishes that feature a main ingredient, for
  "what can I cook with X?" questions
- `save_recipe` / `list_saved_recipes` / `delete_saved_recipe` — keep favorite
  recipes locally (`~/.yerevan-city-mcp/recipes.json`) and reuse them later

### Development

```bash
npm install
npm run typecheck
npm test
npm run build
npm start
```

## License

Free for personal and other non-commercial use. Commercial use requires a
separate paid license — see [LICENSE](LICENSE) for details, and reach out
via [GitHub](https://github.com/tjvjk/) to arrange one.

## Disclaimer

This is an educational, unofficial project — an example of connecting an AI
agent to a third-party web API. It is provided as-is with no warranty of
any kind. It is not affiliated with, endorsed by, or sponsored by Yerevan
City / City Supermarket in any way.

## TODO

- How does the flow behave for a phone number with no existing
  yerevan-city.am account yet?
- How will this work on Windows? Linux?
- Publish npm package and install via npx
- Add formatter and linter
- What if the account has no saved address at all (not just none given
  explicitly)? `add_to_cart`/`get_cart` currently throw
  `NoDeliveryAddressError` in that case — needs a real account with zero
  addresses to confirm that's the right behavior end to end.
