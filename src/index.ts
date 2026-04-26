#!/usr/bin/env node
/**
 * Facebook Business MCP Server
 *
 * An MCP server that connects Claude (or any MCP-compatible client) to the
 * Facebook Graph API for managing:
 *   - Pages
 *   - Posts (and comments)
 *   - Ad Accounts
 *   - Campaigns / Ad Sets / Ads
 *   - Insights and analytics
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { GraphClient, formatGraphError } from "./graph-client.js";
import * as PagesT from "./tools/pages.js";
import * as PostsT from "./tools/posts.js";
import * as AdsT from "./tools/ads.js";
import * as AdSetsT from "./tools/adsets-ads.js";
import * as MiscT from "./tools/misc.js";

// ===== Environment validation =====
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_API_VERSION = process.env.FB_API_VERSION ?? "v21.0";

if (!FB_ACCESS_TOKEN) {
  console.error(
    "❌ FB_ACCESS_TOKEN is not set. Please configure it as an environment variable before running the MCP server."
  );
  process.exit(1);
}

const client = new GraphClient({
  accessToken: FB_ACCESS_TOKEN,
  apiVersion: FB_API_VERSION,
});

const server = new McpServer({
  name: "facebook-business-mcp",
  version: "1.0.0",
});

// Helper that wraps a tool function and returns MCP-formatted responses.
type ToolFn<T> = (args: T) => Promise<any>;
function wrap<T>(fn: ToolFn<T>) {
  return async (args: T) => {
    try {
      const result = await fn(args);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text" as const, text: formatGraphError(err) }],
        isError: true,
      };
    }
  };
}

// ============ Pages ============
server.registerTool(
  "fb_list_pages",
  {
    title: "List Facebook Pages",
    description:
      "Lists all Facebook Pages the current user manages, along with their Page Access Tokens. This is the entry point — call this first to obtain page_id and page_access_token used by other tools.",
    inputSchema: PagesT.ListPagesSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => PagesT.listPages(client, a))
);

server.registerTool(
  "fb_get_page_info",
  {
    title: "Get Page info",
    description:
      "Fetches detailed information for a specific page (about, fan count, location, etc.).",
    inputSchema: PagesT.GetPageInfoSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => PagesT.getPageInfo(client, a))
);

server.registerTool(
  "fb_search_pages",
  {
    title: "Search public Pages",
    description: "Searches public Facebook Pages by keyword.",
    inputSchema: PagesT.SearchPagesSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => PagesT.searchPages(client, a))
);

server.registerTool(
  "fb_get_page_insights",
  {
    title: "Get Page insights",
    description:
      "Fetches Page-level insights (impressions, engaged users, fans, etc.). Requires a Page Access Token, not the User Token.",
    inputSchema: PagesT.GetPageInsightsSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => PagesT.getPageInsights(client, a))
);

// ============ Posts ============
server.registerTool(
  "fb_create_post",
  {
    title: "Create a post",
    description:
      "Publishes a text post (with an optional link) on a Facebook Page. Supports immediate publishing, drafts, and scheduling.",
    inputSchema: PostsT.CreatePostSchema,
    annotations: { destructiveHint: false, idempotentHint: false },
  },
  wrap((a: any) => PostsT.createPost(client, a))
);

server.registerTool(
  "fb_create_photo_post",
  {
    title: "Create a photo post",
    description: "Publishes a photo from a URL on a Page, with an optional caption.",
    inputSchema: PostsT.CreatePhotoPostSchema,
    annotations: { destructiveHint: false, idempotentHint: false },
  },
  wrap((a: any) => PostsT.createPhotoPost(client, a))
);

server.registerTool(
  "fb_list_posts",
  {
    title: "List Page posts",
    description:
      "Lists recent posts on a Page, with engagement stats (reactions, comments, shares).",
    inputSchema: PostsT.ListPostsSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => PostsT.listPosts(client, a))
);

server.registerTool(
  "fb_get_post",
  {
    title: "Get post details",
    description: "Fetches full details for a single post.",
    inputSchema: PostsT.GetPostSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => PostsT.getPost(client, a))
);

server.registerTool(
  "fb_update_post",
  {
    title: "Update a post",
    description: "Updates the message body of an existing post.",
    inputSchema: PostsT.UpdatePostSchema,
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  wrap((a: any) => PostsT.updatePost(client, a))
);

server.registerTool(
  "fb_delete_post",
  {
    title: "Delete a post",
    description: "Permanently deletes a post from a Page.",
    inputSchema: PostsT.DeletePostSchema,
    annotations: { destructiveHint: true, idempotentHint: true },
  },
  wrap((a: any) => PostsT.deletePost(client, a))
);

server.registerTool(
  "fb_get_post_insights",
  {
    title: "Get post insights",
    description:
      "Fetches insights for a specific post (impressions, engaged users, clicks, reactions by type).",
    inputSchema: PostsT.GetPostInsightsSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => PostsT.getPostInsights(client, a))
);

server.registerTool(
  "fb_list_comments",
  {
    title: "List comments on a post",
    description: "Lists comments on a post.",
    inputSchema: PostsT.ListCommentsSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => PostsT.listComments(client, a))
);

server.registerTool(
  "fb_reply_to_comment",
  {
    title: "Reply to a comment",
    description: "Posts a reply to a specific comment using the Page identity.",
    inputSchema: PostsT.ReplyToCommentSchema,
    annotations: { destructiveHint: false, idempotentHint: false },
  },
  wrap((a: any) => PostsT.replyToComment(client, a))
);

// ============ Ad Accounts & Campaigns ============
server.registerTool(
  "fb_list_ad_accounts",
  {
    title: "List ad accounts",
    description:
      "Lists all ad accounts the current user can manage. Use this to discover account IDs (act_XXX) used by campaign tools.",
    inputSchema: AdsT.ListAdAccountsSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => AdsT.listAdAccounts(client, a))
);

server.registerTool(
  "fb_get_ad_account",
  {
    title: "Get ad account",
    description: "Fetches details for an ad account (balance, currency, status, etc.).",
    inputSchema: AdsT.GetAdAccountSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => AdsT.getAdAccount(client, a))
);

server.registerTool(
  "fb_list_campaigns",
  {
    title: "List campaigns",
    description: "Lists campaigns in an ad account, with optional filtering by status.",
    inputSchema: AdsT.ListCampaignsSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => AdsT.listCampaigns(client, a))
);

server.registerTool(
  "fb_get_campaign",
  {
    title: "Get campaign",
    description: "Fetches details for a campaign.",
    inputSchema: AdsT.GetCampaignSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => AdsT.getCampaign(client, a))
);

server.registerTool(
  "fb_create_campaign",
  {
    title: "Create campaign",
    description:
      "Creates a new advertising campaign. ⚠️ Recommendation: start with status=PAUSED, then activate after Ad Sets and Ads are ready.",
    inputSchema: AdsT.CreateCampaignSchema,
    annotations: { destructiveHint: false, idempotentHint: false },
  },
  wrap((a: any) => AdsT.createCampaign(client, a))
);

server.registerTool(
  "fb_update_campaign",
  {
    title: "Update campaign",
    description:
      "Updates a campaign (name, status, budget). Use this to pause, resume or rename a campaign.",
    inputSchema: AdsT.UpdateCampaignSchema,
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  wrap((a: any) => AdsT.updateCampaign(client, a))
);

server.registerTool(
  "fb_delete_campaign",
  {
    title: "Delete campaign",
    description: "Deletes a campaign. Consider using update_campaign(status=ARCHIVED) for archiving instead of deletion.",
    inputSchema: AdsT.DeleteCampaignSchema,
    annotations: { destructiveHint: true, idempotentHint: true },
  },
  wrap((a: any) => AdsT.deleteCampaign(client, a))
);

// ============ Ad Sets ============
server.registerTool(
  "fb_list_adsets",
  {
    title: "List Ad Sets",
    description: "Lists Ad Sets within a campaign or ad account.",
    inputSchema: AdSetsT.ListAdSetsSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => AdSetsT.listAdSets(client, a))
);

server.registerTool(
  "fb_get_adset",
  {
    title: "Get Ad Set",
    description: "Fetches details for an Ad Set including targeting and budget.",
    inputSchema: AdSetsT.GetAdSetSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => AdSetsT.getAdSet(client, a))
);

server.registerTool(
  "fb_update_adset",
  {
    title: "Update Ad Set",
    description: "Updates an Ad Set (name, status, budget, bid).",
    inputSchema: AdSetsT.UpdateAdSetSchema,
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  wrap((a: any) => AdSetsT.updateAdSet(client, a))
);

// ============ Ads ============
server.registerTool(
  "fb_list_ads",
  {
    title: "List Ads",
    description: "Lists ads within an ad set, campaign, or ad account.",
    inputSchema: AdSetsT.ListAdsSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => AdSetsT.listAds(client, a))
);

server.registerTool(
  "fb_get_ad",
  {
    title: "Get Ad",
    description: "Fetches details for a single ad.",
    inputSchema: AdSetsT.GetAdSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => AdSetsT.getAd(client, a))
);

server.registerTool(
  "fb_update_ad",
  {
    title: "Update Ad",
    description: "Updates an ad's name or status.",
    inputSchema: AdSetsT.UpdateAdSchema,
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  wrap((a: any) => AdSetsT.updateAd(client, a))
);

server.registerTool(
  "fb_list_ad_creatives",
  {
    title: "List Ad Creatives",
    description: "Lists ad creatives in an ad account.",
    inputSchema: AdSetsT.ListAdCreativesSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => AdSetsT.listAdCreatives(client, a))
);

// ============ Insights ============
server.registerTool(
  "fb_get_insights",
  {
    title: "Get performance insights",
    description:
      "Powerful insights tool that works at any level (account/campaign/adset/ad). Supports date_preset or a custom time_range, and breakdowns by age, gender, device, country, etc.",
    inputSchema: AdSetsT.GetInsightsSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => AdSetsT.getInsights(client, a))
);

// ============ Misc ============
server.registerTool(
  "fb_get_me",
  {
    title: "Get current user",
    description: "Returns information about the current user (the token's owner).",
    inputSchema: MiscT.GetMeSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => MiscT.getMe(client, a))
);

server.registerTool(
  "fb_debug_token",
  {
    title: "Debug access token",
    description:
      "Inspects a Facebook access token (App ID, scopes, expiration). Useful for diagnosing token problems.",
    inputSchema: MiscT.DebugTokenSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => MiscT.debugToken(client, a, FB_ACCESS_TOKEN))
);

server.registerTool(
  "fb_list_businesses",
  {
    title: "List Business Manager accounts",
    description: "Lists all Business Manager accounts the user has access to.",
    inputSchema: MiscT.ListBusinessesSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => MiscT.listBusinesses(client, a))
);

server.registerTool(
  "fb_get_business",
  {
    title: "Get Business details",
    description: "Fetches details for a Business Manager account.",
    inputSchema: MiscT.GetBusinessSchema,
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  wrap((a: any) => MiscT.getBusiness(client, a))
);

// ===== Run =====
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Facebook Business MCP Server is running on stdio");
}

main().catch((err) => {
  console.error("❌ Failed to start the server:", err);
  process.exit(1);
});
