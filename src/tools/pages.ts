/**
 * Tools for managing Facebook Pages.
 */
import { z } from "zod";
import { GraphClient } from "../graph-client.js";

export const ListPagesSchema = {
  fields: z
    .string()
    .optional()
    .describe(
      "Comma-separated extra fields. Default: id,name,category,fan_count,access_token,tasks,link"
    ),
  limit: z.number().int().min(1).max(100).optional().default(25)
    .describe("Number of pages per response"),
};

export async function listPages(
  client: GraphClient,
  args: { fields?: string; limit?: number }
) {
  const fields =
    args.fields ?? "id,name,category,fan_count,access_token,tasks,link";
  const data = await client.get<any>("/me/accounts", {
    fields,
    limit: args.limit ?? 25,
  });
  return {
    total: data?.data?.length ?? 0,
    pages: data?.data ?? [],
    paging: data?.paging,
  };
}

export const GetPageInfoSchema = {
  page_id: z.string().describe("Page ID or username"),
  fields: z
    .string()
    .optional()
    .describe(
      "Fields to retrieve. Default covers a wide set: name,about,description,category,fan_count,followers_count,link,website,phone,emails,location,is_published,verification_status"
    ),
};

export async function getPageInfo(
  client: GraphClient,
  args: { page_id: string; fields?: string }
) {
  const fields =
    args.fields ??
    "id,name,about,description,category,fan_count,followers_count,link,website,phone,emails,location,is_published,verification_status,picture";
  return await client.get<any>(`/${args.page_id}`, { fields });
}

export const GetPageInsightsSchema = {
  page_id: z.string().describe("Page ID"),
  page_access_token: z
    .string()
    .describe(
      "Page Access Token (obtain from list_pages). Insights require a Page token, not the User token."
    ),
  metrics: z
    .string()
    .optional()
    .describe(
      "Comma-separated metrics. Examples: page_impressions,page_engaged_users,page_post_engagements,page_fans,page_views_total"
    ),
  period: z
    .enum(["day", "week", "days_28", "month", "lifetime"])
    .optional()
    .default("day")
    .describe("Aggregation period"),
  since: z
    .string()
    .optional()
    .describe("Start date (YYYY-MM-DD or UNIX timestamp)"),
  until: z
    .string()
    .optional()
    .describe("End date (YYYY-MM-DD or UNIX timestamp)"),
};

export async function getPageInsights(
  client: GraphClient,
  args: {
    page_id: string;
    page_access_token: string;
    metrics?: string;
    period?: string;
    since?: string;
    until?: string;
  }
) {
  const pageClient = client.withToken(args.page_access_token);
  const metric =
    args.metrics ??
    "page_impressions,page_engaged_users,page_post_engagements,page_fans";
  return await pageClient.get<any>(`/${args.page_id}/insights`, {
    metric,
    period: args.period ?? "day",
    since: args.since,
    until: args.until,
  });
}

export const SearchPagesSchema = {
  query: z.string().describe("Search query string"),
  limit: z.number().int().min(1).max(50).optional().default(10),
};

export async function searchPages(
  client: GraphClient,
  args: { query: string; limit?: number }
) {
  return await client.get<any>("/pages/search", {
    q: args.query,
    fields: "id,name,category,verification_status,link,fan_count",
    limit: args.limit ?? 10,
  });
}
