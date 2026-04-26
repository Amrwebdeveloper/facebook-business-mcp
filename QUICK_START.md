# Quick Start

## 5-minute setup

### 1. Get an Access Token

Go to the [Graph API Explorer](https://developers.facebook.com/tools/explorer/), pick your app, click **Generate Access Token**, and grant these scopes:

```
pages_show_list, pages_read_engagement, pages_manage_posts,
pages_manage_metadata, pages_read_user_content, pages_manage_engagement,
read_insights, ads_read, ads_management, business_management
```

### 2. Extend it to a 60-day token

Open the [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/), paste the token, and click **Extend Access Token**.

### 3. Build the server

```bash
git clone https://github.com/YOUR_USERNAME/facebook-business-mcp.git
cd facebook-business-mcp
npm install
npm run build
```

### 4. Connect to Claude Desktop

Open `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) and add:

```json
{
  "mcpServers": {
    "facebook-business": {
      "command": "node",
      "args": ["/absolute/path/to/facebook-business-mcp/build/index.js"],
      "env": {
        "FB_ACCESS_TOKEN": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

### 5. Restart Claude

You'll have 32 new tools available. Try asking:

- *"List my Facebook pages"*
- *"How much did I spend on ads yesterday?"*
- *"Post on my page: 'Welcome!'"*

That's it.
