# Facebook Business MCP Server

A Model Context Protocol (MCP) server that lets [Claude](https://claude.ai) (Desktop, Code, or any MCP-compatible client) manage your Facebook Business assets directly: Pages, posts, comments, ad accounts, campaigns, ad sets, ads, and insights.

> Built on the official [Facebook Graph API](https://developers.facebook.com/docs/graph-api) and the [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk).

## Features

- **Pages** — list pages you manage, fetch info, search public pages, page insights.
- **Posts** — create text/photo/link posts, schedule publishing, edit, delete, get insights.
- **Comments** — list and reply to comments using the Page identity.
- **Ad Accounts & Campaigns** — list, create, update, pause/activate, delete.
- **Ad Sets & Ads** — full read/update support across the campaign hierarchy.
- **Insights** — flexible insights tool with date presets, custom date ranges, and breakdowns (age, gender, country, device, placement…).
- **Business Manager** — list and inspect Business Manager accounts.
- **Token diagnostics** — debug access tokens and their scopes.

A total of **32 tools** exposed over `stdio` transport.

## Requirements

- Node.js 18+
- A Facebook Developer account: <https://developers.facebook.com/>
- A Facebook App with the **Marketing API** product enabled (for ads tools)
- A User Access Token with the right scopes (see below)

## Quick install (Claude Code plugin) — recommended

If you use **Claude Code**, install everything in two commands:

```
/plugin marketplace add Amrwebdeveloper/facebook-business-mcp
/plugin install facebook-business@facebook-business-mcp
```

Claude Code will prompt you for your **Facebook Access Token** once, then keep it in your local secure storage. The MCP server (32 tools, prefixed `fb_`) is auto-registered — no `claude mcp add`, no editing config files. First launch installs runtime dependencies (one time, a few seconds).

To get a token, see [Generate an Access Token](#3-generate-an-access-token) below.

---

## Manual setup

### 1. Clone and install

```bash
git clone https://github.com/Amrwebdeveloper/facebook-business-mcp.git
cd facebook-business-mcp
npm install
npm run build
```

### 2. Create a Facebook App

1. Go to <https://developers.facebook.com/apps/> and click **Create App**.
2. Choose the **Business** type.
3. From the left sidebar, add the products you need:
   - **Marketing API** — required for any ad/campaign tool
   - **Facebook Login** — required to issue tokens

### 3. Generate an Access Token

1. Open the [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Pick your app from the **Meta App** dropdown.
3. Click **Generate Access Token** and grant the following permissions:

   ```
   pages_show_list
   pages_read_engagement
   pages_manage_posts
   pages_manage_metadata
   pages_read_user_content
   pages_manage_engagement
   read_insights
   ads_read
   ads_management
   business_management
   public_profile
   email
   ```

4. Copy the generated token.

### 4. Extend the token to a long-lived (60-day) token

Open the [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/), paste your token, and click **Extend Access Token**.

For a permanent token, create a System User inside Business Manager and issue a never-expiring token: <https://developers.facebook.com/docs/marketing-api/system-users>

## Connect to Claude

### Claude Desktop

Edit your Claude Desktop config:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

Add the server (replace the path and the token with your own):

```json
{
  "mcpServers": {
    "facebook-business": {
      "command": "node",
      "args": [
        "/absolute/path/to/facebook-business-mcp/build/index.js"
      ],
      "env": {
        "FB_ACCESS_TOKEN": "YOUR_LONG_LIVED_TOKEN_HERE",
        "FB_API_VERSION": "v21.0"
      }
    }
  }
}
```

Restart Claude Desktop. The 32 tools (prefixed with `fb_`) will appear automatically.

### Claude Code

Add the server with one command:

```bash
claude mcp add facebook-business \
  --env FB_ACCESS_TOKEN=YOUR_LONG_LIVED_TOKEN_HERE \
  -- node /absolute/path/to/facebook-business-mcp/build/index.js
```

### Cursor / Other MCP Clients

Any client that speaks MCP over stdio can use this server. The launch command is:

```bash
FB_ACCESS_TOKEN=... node build/index.js
```

## Verify the connection

Run the server manually first:

```bash
export FB_ACCESS_TOKEN=YOUR_TOKEN
node build/index.js
```

You should see:

```
✅ Facebook Business MCP Server is running on stdio
```

Then use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) for an interactive UI:

```bash
npm run inspect
```

## Tools reference

### Pages

| Tool | Description |
|------|-------------|
| `fb_list_pages` | List pages you manage (returns Page Access Tokens) |
| `fb_get_page_info` | Detailed info for a specific page |
| `fb_search_pages` | Search public pages |
| `fb_get_page_insights` | Page-level insights (impressions, fans, engagement) |

### Posts & Comments

| Tool | Description |
|------|-------------|
| `fb_create_post` | Publish a text/link post (immediate, draft, or scheduled) |
| `fb_create_photo_post` | Publish a photo post from a URL |
| `fb_list_posts` | List recent posts with engagement stats |
| `fb_get_post` | Fetch a single post |
| `fb_update_post` | Update a post's message |
| `fb_delete_post` | Permanently delete a post |
| `fb_get_post_insights` | Post-level insights |
| `fb_list_comments` | List comments on a post |
| `fb_reply_to_comment` | Reply to a comment as the page |

### Ad Accounts & Campaigns

| Tool | Description |
|------|-------------|
| `fb_list_ad_accounts` | List ad accounts |
| `fb_get_ad_account` | Ad account details |
| `fb_list_campaigns` | List campaigns (with optional status filter) |
| `fb_get_campaign` | Campaign details |
| `fb_create_campaign` | Create a campaign (start with PAUSED) |
| `fb_update_campaign` | Update name / status / budget |
| `fb_delete_campaign` | Delete a campaign |

### Ad Sets & Ads

| Tool | Description |
|------|-------------|
| `fb_list_adsets` | List ad sets in a campaign or account |
| `fb_get_adset` | Ad set details |
| `fb_update_adset` | Update an ad set |
| `fb_list_ads` | List ads at any level |
| `fb_get_ad` | Ad details |
| `fb_update_ad` | Update an ad |
| `fb_list_ad_creatives` | List ad creatives |

### Insights

| Tool | Description |
|------|-------------|
| `fb_get_insights` | Performance insights at any level (account, campaign, adset, ad) with breakdowns |

### Misc

| Tool | Description |
|------|-------------|
| `fb_get_me` | Info about the user the token belongs to |
| `fb_debug_token` | Inspect a token's scopes & expiration |
| `fb_list_businesses` | List Business Manager accounts |
| `fb_get_business` | Business Manager details |

## Example prompts

After the server is connected, just ask Claude in natural language:

- *"List my Facebook pages."*
- *"Post on my page \"My Brand\": 'Welcome to our spring sale, 20% off everything!'"*
- *"Schedule that same post for next Monday at 9am."*
- *"What's my total ad spend in the last 7 days?"*
- *"Show me the top 5 campaigns by ROAS this month, broken down by gender."*
- *"Pause every campaign with CPM over $50."*
- *"Reply to all the comments on my latest post that ask about pricing with: 'Thanks for asking! DM us for a quote.'"*

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Code: 190` | Token expired or invalid | Regenerate from Graph API Explorer |
| `Code: 200` / `10` | Missing permissions | Re-issue token with the scopes listed above |
| `Code: 100` | Invalid ID/parameter | Double-check the IDs you passed |
| `Code: 4` / `17` / `32` | Rate limited | Wait a minute and retry |
| `Application does not have permission` | App is in dev mode | Add yourself as Tester/Admin, or submit the app for App Review |

## Notes

- **Page Access Tokens** are required for most page operations. Always start by calling `fb_list_pages` to obtain them.
- When **creating campaigns**, always start with `status=PAUSED`. Activate only after Ad Sets and Ads are configured and reviewed.
- **Budgets** are in the smallest unit of the account currency (e.g. `1000` = `10.00 USD`).
- **Special Ad Categories** are required for campaign creation — use `["NONE"]` for regular campaigns.
- A short-lived User Token lasts 1 hour. Always extend to a long-lived token (60 days) for development. For production, use a System User token.

## Security

- **Never commit your token to git.** `.env` and credentials are already in `.gitignore`.
- **Never share your token publicly.** Anyone with the token can act as you on Facebook.
- If a token is leaked, regenerate the App Secret in your Facebook App's settings — that invalidates all tokens.

## License

MIT — see [LICENSE](./LICENSE).

## References

- [Graph API Reference](https://developers.facebook.com/docs/graph-api)
- [Marketing API](https://developers.facebook.com/docs/marketing-api)
- [Pages API](https://developers.facebook.com/docs/pages-api)
- [Permissions Reference](https://developers.facebook.com/docs/permissions/reference)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## Contributing

Issues and PRs welcome. Please make sure `npm run build` passes before submitting.
