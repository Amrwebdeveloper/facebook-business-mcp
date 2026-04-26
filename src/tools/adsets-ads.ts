/**
 * Tools for Ad Sets, Ads and Insights.
 */
import { z } from "zod";
import { GraphClient } from "../graph-client.js";

// ============ Ad Sets ============

export const ListAdSetsSchema = {
  parent_id: z
    .string()
    .describe("act_XXX (all adsets in account) or campaign_id (adsets in a campaign)"),
  fields: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(25),
};

export async function listAdSets(
  client: GraphClient,
  args: { parent_id: string; fields?: string; limit?: number }
) {
  const id = args.parent_id;
  const fields =
    args.fields ??
    "id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,billing_event,optimization_goal,bid_amount,targeting,start_time,end_time,created_time";
  return await client.get<any>(`/${id}/adsets`, {
    fields,
    limit: args.limit ?? 25,
  });
}

export const GetAdSetSchema = {
  adset_id: z.string(),
  fields: z.string().optional(),
};

export async function getAdSet(
  client: GraphClient,
  args: { adset_id: string; fields?: string }
) {
  const fields =
    args.fields ??
    "id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,billing_event,optimization_goal,bid_amount,targeting,start_time,end_time,created_time,updated_time,promoted_object";
  return await client.get<any>(`/${args.adset_id}`, { fields });
}

export const UpdateAdSetSchema = {
  adset_id: z.string(),
  name: z.string().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "DELETED", "ARCHIVED"]).optional(),
  daily_budget: z.number().int().optional(),
  lifetime_budget: z.number().int().optional(),
  bid_amount: z.number().int().optional(),
};

export async function updateAdSet(
  client: GraphClient,
  args: {
    adset_id: string;
    name?: string;
    status?: string;
    daily_budget?: number;
    lifetime_budget?: number;
    bid_amount?: number;
  }
) {
  const body: any = {};
  if (args.name) body.name = args.name;
  if (args.status) body.status = args.status;
  if (args.daily_budget) body.daily_budget = args.daily_budget;
  if (args.lifetime_budget) body.lifetime_budget = args.lifetime_budget;
  if (args.bid_amount) body.bid_amount = args.bid_amount;
  return await client.post<{ success: boolean }>(`/${args.adset_id}`, body);
}

// ============ Ads ============

export const ListAdsSchema = {
  parent_id: z
    .string()
    .describe("act_XXX, campaign_id or adset_id depending on the level you want"),
  fields: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(25),
};

export async function listAds(
  client: GraphClient,
  args: { parent_id: string; fields?: string; limit?: number }
) {
  const fields =
    args.fields ??
    "id,name,adset_id,campaign_id,status,effective_status,creative,created_time,updated_time";
  return await client.get<any>(`/${args.parent_id}/ads`, {
    fields,
    limit: args.limit ?? 25,
  });
}

export const GetAdSchema = {
  ad_id: z.string(),
  fields: z.string().optional(),
};

export async function getAd(
  client: GraphClient,
  args: { ad_id: string; fields?: string }
) {
  const fields =
    args.fields ??
    "id,name,adset_id,campaign_id,status,effective_status,creative,created_time,updated_time,preview_shareable_link";
  return await client.get<any>(`/${args.ad_id}`, { fields });
}

export const UpdateAdSchema = {
  ad_id: z.string(),
  name: z.string().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "DELETED", "ARCHIVED"]).optional(),
};

export async function updateAd(
  client: GraphClient,
  args: { ad_id: string; name?: string; status?: string }
) {
  const body: any = {};
  if (args.name) body.name = args.name;
  if (args.status) body.status = args.status;
  return await client.post<{ success: boolean }>(`/${args.ad_id}`, body);
}

// ============ Insights ============

export const GetInsightsSchema = {
  object_id: z
    .string()
    .describe(
      "ID of an ad account (act_XXX), campaign, ad set, or ad to fetch insights for"
    ),
  level: z
    .enum(["account", "campaign", "adset", "ad"])
    .optional()
    .describe("Aggregation level"),
  fields: z
    .string()
    .optional()
    .describe(
      "Comma-separated fields. Examples: impressions,reach,clicks,ctr,cpc,cpm,spend,actions,cost_per_action_type,frequency"
    ),
  date_preset: z
    .enum([
      "today",
      "yesterday",
      "this_month",
      "last_month",
      "this_quarter",
      "maximum",
      "last_3d",
      "last_7d",
      "last_14d",
      "last_28d",
      "last_30d",
      "last_90d",
      "last_week_mon_sun",
      "last_week_sun_sat",
      "last_quarter",
      "last_year",
      "this_week_mon_today",
      "this_week_sun_today",
      "this_year",
    ])
    .optional()
    .describe("Preset date range. Do not combine with time_range."),
  time_range: z
    .object({
      since: z.string().describe("YYYY-MM-DD"),
      until: z.string().describe("YYYY-MM-DD"),
    })
    .optional()
    .describe("Custom date range. Do not combine with date_preset."),
  breakdowns: z
    .string()
    .optional()
    .describe(
      "Breakdown dimensions. Examples: age,gender,country,publisher_platform,placement,device_platform"
    ),
  limit: z.number().int().min(1).max(500).optional().default(50),
};

export async function getInsights(
  client: GraphClient,
  args: {
    object_id: string;
    level?: string;
    fields?: string;
    date_preset?: string;
    time_range?: { since: string; until: string };
    breakdowns?: string;
    limit?: number;
  }
) {
  const params: any = {
    fields:
      args.fields ??
      "impressions,reach,clicks,ctr,cpc,cpm,spend,frequency,actions,cost_per_action_type,date_start,date_stop",
    limit: args.limit ?? 50,
  };
  if (args.level) params.level = args.level;
  if (args.date_preset) params.date_preset = args.date_preset;
  if (args.time_range) params.time_range = JSON.stringify(args.time_range);
  if (args.breakdowns) params.breakdowns = args.breakdowns;
  return await client.get<any>(`/${args.object_id}/insights`, params);
}

// ============ Creative ============

export const ListAdCreativesSchema = {
  ad_account_id: z.string().describe("act_XXX"),
  limit: z.number().int().min(1).max(100).optional().default(25),
};

export async function listAdCreatives(
  client: GraphClient,
  args: { ad_account_id: string; limit?: number }
) {
  const id = args.ad_account_id.startsWith("act_")
    ? args.ad_account_id
    : `act_${args.ad_account_id}`;
  return await client.get<any>(`/${id}/adcreatives`, {
    fields: "id,name,object_story_spec,object_type,thumbnail_url,body,title,call_to_action_type,image_url,video_id",
    limit: args.limit ?? 25,
  });
}
