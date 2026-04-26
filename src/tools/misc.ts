/**
 * Misc tools — current user info, token inspection, businesses.
 */
import { z } from "zod";
import { GraphClient } from "../graph-client.js";

export const GetMeSchema = {
  fields: z.string().optional().describe("Fields. Default: id,name,email,picture"),
};

export async function getMe(
  client: GraphClient,
  args: { fields?: string }
) {
  return await client.get<any>("/me", {
    fields: args.fields ?? "id,name,email,picture",
  });
}

export const DebugTokenSchema = {
  input_token: z
    .string()
    .optional()
    .describe(
      "Token to inspect. Defaults to the token configured in the environment."
    ),
};

export async function debugToken(
  client: GraphClient,
  args: { input_token?: string },
  envToken: string
) {
  const target = args.input_token ?? envToken;
  return await client.get<any>("/debug_token", { input_token: target });
}

export const ListBusinessesSchema = {
  limit: z.number().int().min(1).max(100).optional().default(25),
};

export async function listBusinesses(
  client: GraphClient,
  args: { limit?: number }
) {
  return await client.get<any>("/me/businesses", {
    fields: "id,name,verification_status,vertical,timezone_id,primary_page",
    limit: args.limit ?? 25,
  });
}

export const GetBusinessSchema = {
  business_id: z.string(),
};

export async function getBusiness(
  client: GraphClient,
  args: { business_id: string }
) {
  return await client.get<any>(`/${args.business_id}`, {
    fields:
      "id,name,verification_status,vertical,timezone_id,primary_page,created_time,owned_pages,owned_ad_accounts",
  });
}
