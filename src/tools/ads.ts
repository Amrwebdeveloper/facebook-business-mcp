/**
 * Tools for managing Ad Accounts and Campaigns.
 */
import { z } from "zod";
import { GraphClient } from "../graph-client.js";

// ============ Ad Accounts ============

export const ListAdAccountsSchema = {
  fields: z
    .string()
    .optional()
    .describe(
      "Fields. Default: id,name,account_status,currency,timezone_name,balance,amount_spent,business"
    ),
  limit: z.number().int().min(1).max(100).optional().default(25),
};

export async function listAdAccounts(
  client: GraphClient,
  args: { fields?: string; limit?: number }
) {
  const fields =
    args.fields ??
    "id,account_id,name,account_status,currency,timezone_name,balance,amount_spent,business,disable_reason";
  return await client.get<any>("/me/adaccounts", {
    fields,
    limit: args.limit ?? 25,
  });
}

export const GetAdAccountSchema = {
  ad_account_id: z
    .string()
    .describe("Ad account ID, including the act_ prefix (e.g. act_1234567890)"),
  fields: z.string().optional(),
};

export async function getAdAccount(
  client: GraphClient,
  args: { ad_account_id: string; fields?: string }
) {
  const id = args.ad_account_id.startsWith("act_")
    ? args.ad_account_id
    : `act_${args.ad_account_id}`;
  const fields =
    args.fields ??
    "id,account_id,name,account_status,currency,timezone_name,balance,amount_spent,spend_cap,business,age,funding_source_details";
  return await client.get<any>(`/${id}`, { fields });
}

// ============ Campaigns ============

export const ListCampaignsSchema = {
  ad_account_id: z.string().describe("act_XXXXXXXXX"),
  status: z
    .array(z.enum(["ACTIVE", "PAUSED", "DELETED", "ARCHIVED"]))
    .optional()
    .describe("Filter by effective campaign status"),
  fields: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(25),
};

export async function listCampaigns(
  client: GraphClient,
  args: {
    ad_account_id: string;
    status?: string[];
    fields?: string;
    limit?: number;
  }
) {
  const id = args.ad_account_id.startsWith("act_")
    ? args.ad_account_id
    : `act_${args.ad_account_id}`;
  const fields =
    args.fields ??
    "id,name,objective,status,effective_status,daily_budget,lifetime_budget,buying_type,start_time,stop_time,created_time,updated_time,special_ad_categories";
  const params: any = { fields, limit: args.limit ?? 25 };
  if (args.status?.length) {
    params.effective_status = JSON.stringify(args.status);
  }
  return await client.get<any>(`/${id}/campaigns`, params);
}

export const CreateCampaignSchema = {
  ad_account_id: z.string().describe("act_XXXXXXXXX"),
  name: z.string().describe("Campaign name"),
  objective: z
    .enum([
      "OUTCOME_AWARENESS",
      "OUTCOME_TRAFFIC",
      "OUTCOME_ENGAGEMENT",
      "OUTCOME_LEADS",
      "OUTCOME_APP_PROMOTION",
      "OUTCOME_SALES",
    ])
    .describe(
      "Campaign objective — use only the new ODAX objectives (e.g. OUTCOME_TRAFFIC for traffic)."
    ),
  status: z.enum(["ACTIVE", "PAUSED"]).optional().default("PAUSED")
    .describe("Initial status. Recommended: PAUSED first, then activate after review"),
  special_ad_categories: z
    .array(
      z.enum([
        "EMPLOYMENT",
        "HOUSING",
        "CREDIT",
        "ISSUES_ELECTIONS_POLITICS",
        "ONLINE_GAMBLING_AND_GAMING",
        "FINANCIAL_PRODUCTS_SERVICES",
        "NONE",
      ])
    )
    .optional()
    .default(["NONE"])
    .describe("Special ad categories — required, use ['NONE'] for regular campaigns"),
  daily_budget: z
    .number()
    .int()
    .optional()
    .describe(
      "Daily budget in the smallest unit of the account currency (e.g. 1000 = 10.00)"
    ),
  lifetime_budget: z
    .number()
    .int()
    .optional()
    .describe("Lifetime budget (use instead of daily_budget)"),
  buying_type: z
    .enum(["AUCTION", "RESERVED"])
    .optional()
    .default("AUCTION"),
};

export async function createCampaign(
  client: GraphClient,
  args: {
    ad_account_id: string;
    name: string;
    objective: string;
    status?: string;
    special_ad_categories?: string[];
    daily_budget?: number;
    lifetime_budget?: number;
    buying_type?: string;
  }
) {
  const id = args.ad_account_id.startsWith("act_")
    ? args.ad_account_id
    : `act_${args.ad_account_id}`;
  const body: any = {
    name: args.name,
    objective: args.objective,
    status: args.status ?? "PAUSED",
    special_ad_categories: JSON.stringify(args.special_ad_categories ?? ["NONE"]),
    buying_type: args.buying_type ?? "AUCTION",
  };
  if (args.daily_budget) body.daily_budget = args.daily_budget;
  if (args.lifetime_budget) body.lifetime_budget = args.lifetime_budget;
  return await client.post<{ id: string }>(`/${id}/campaigns`, body);
}

export const UpdateCampaignSchema = {
  campaign_id: z.string().describe("Campaign ID"),
  name: z.string().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "DELETED", "ARCHIVED"]).optional(),
  daily_budget: z.number().int().optional(),
  lifetime_budget: z.number().int().optional(),
};

export async function updateCampaign(
  client: GraphClient,
  args: {
    campaign_id: string;
    name?: string;
    status?: string;
    daily_budget?: number;
    lifetime_budget?: number;
  }
) {
  const body: any = {};
  if (args.name) body.name = args.name;
  if (args.status) body.status = args.status;
  if (args.daily_budget) body.daily_budget = args.daily_budget;
  if (args.lifetime_budget) body.lifetime_budget = args.lifetime_budget;
  return await client.post<{ success: boolean }>(`/${args.campaign_id}`, body);
}

export const DeleteCampaignSchema = {
  campaign_id: z.string(),
};

export async function deleteCampaign(
  client: GraphClient,
  args: { campaign_id: string }
) {
  return await client.delete<{ success: boolean }>(`/${args.campaign_id}`);
}

export const GetCampaignSchema = {
  campaign_id: z.string(),
  fields: z.string().optional(),
};

export async function getCampaign(
  client: GraphClient,
  args: { campaign_id: string; fields?: string }
) {
  const fields =
    args.fields ??
    "id,name,objective,status,effective_status,daily_budget,lifetime_budget,buying_type,start_time,stop_time,created_time,updated_time,special_ad_categories,bid_strategy,budget_remaining";
  return await client.get<any>(`/${args.campaign_id}`, { fields });
}
