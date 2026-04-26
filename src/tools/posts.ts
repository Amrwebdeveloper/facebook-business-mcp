/**
 * Tools for managing Page posts.
 */
import { z } from "zod";
import { GraphClient } from "../graph-client.js";

export const CreatePostSchema = {
  page_id: z.string().describe("ID of the page to publish to"),
  page_access_token: z
    .string()
    .describe("Page Access Token for the target page"),
  message: z.string().optional().describe("Post text content"),
  link: z
    .string()
    .url()
    .optional()
    .describe("Optional URL to attach — Facebook will auto-generate a preview card"),
  published: z
    .boolean()
    .optional()
    .default(true)
    .describe("Publish immediately? Set to false to save as a draft."),
  scheduled_publish_time: z
    .number()
    .int()
    .optional()
    .describe(
      "UNIX timestamp for scheduling. Must be between 10 minutes and 6 months from now. When set, published is forced to false."
    ),
};

export async function createPost(
  client: GraphClient,
  args: {
    page_id: string;
    page_access_token: string;
    message?: string;
    link?: string;
    published?: boolean;
    scheduled_publish_time?: number;
  }
) {
  if (!args.message && !args.link) {
    throw new Error("You must provide either 'message' or 'link' to create a post.");
  }
  const pageClient = client.withToken(args.page_access_token);
  const body: Record<string, any> = {};
  if (args.message) body.message = args.message;
  if (args.link) body.link = args.link;
  if (args.published === false) body.published = false;
  if (args.scheduled_publish_time) {
    body.scheduled_publish_time = args.scheduled_publish_time;
    body.published = false;
  }
  return await pageClient.post<{ id: string }>(`/${args.page_id}/feed`, body);
}

export const CreatePhotoPostSchema = {
  page_id: z.string().describe("Page ID"),
  page_access_token: z.string().describe("Page Access Token"),
  image_url: z.string().url().describe("Publicly accessible image URL"),
  caption: z.string().optional().describe("Caption text for the photo"),
  published: z.boolean().optional().default(true),
};

export async function createPhotoPost(
  client: GraphClient,
  args: {
    page_id: string;
    page_access_token: string;
    image_url: string;
    caption?: string;
    published?: boolean;
  }
) {
  const pageClient = client.withToken(args.page_access_token);
  const body: Record<string, any> = { url: args.image_url };
  if (args.caption) body.caption = args.caption;
  if (args.published === false) body.published = false;
  return await pageClient.post<{ id: string; post_id?: string }>(
    `/${args.page_id}/photos`,
    body
  );
}

export const ListPostsSchema = {
  page_id: z.string().describe("Page ID"),
  page_access_token: z
    .string()
    .optional()
    .describe(
      "Page Access Token (recommended to see all posts). If omitted, uses the User Token."
    ),
  limit: z.number().int().min(1).max(100).optional().default(25),
  fields: z
    .string()
    .optional()
    .describe(
      "Fields to retrieve. Default: id,message,created_time,permalink_url,full_picture,reactions.summary(total_count),comments.summary(total_count),shares"
    ),
  since: z.string().optional().describe("Start date (YYYY-MM-DD)"),
  until: z.string().optional().describe("End date (YYYY-MM-DD)"),
};

export async function listPosts(
  client: GraphClient,
  args: {
    page_id: string;
    page_access_token?: string;
    limit?: number;
    fields?: string;
    since?: string;
    until?: string;
  }
) {
  const c = args.page_access_token
    ? client.withToken(args.page_access_token)
    : client;
  const fields =
    args.fields ??
    "id,message,created_time,permalink_url,full_picture,reactions.summary(total_count),comments.summary(total_count),shares,is_published,status_type";
  return await c.get<any>(`/${args.page_id}/posts`, {
    fields,
    limit: args.limit ?? 25,
    since: args.since,
    until: args.until,
  });
}

export const GetPostSchema = {
  post_id: z
    .string()
    .describe(
      "Full post ID in the format page_id_post_id (e.g. 1234567890_9876543210)."
    ),
  page_access_token: z.string().optional(),
  fields: z.string().optional(),
};

export async function getPost(
  client: GraphClient,
  args: { post_id: string; page_access_token?: string; fields?: string }
) {
  const c = args.page_access_token
    ? client.withToken(args.page_access_token)
    : client;
  const fields =
    args.fields ??
    "id,message,created_time,updated_time,permalink_url,full_picture,reactions.summary(total_count),comments.summary(total_count),shares,is_published,status_type,from";
  return await c.get<any>(`/${args.post_id}`, { fields });
}

export const UpdatePostSchema = {
  post_id: z.string().describe("Post ID (page_id_post_id)"),
  page_access_token: z.string().describe("Page Access Token"),
  message: z.string().describe("New message body"),
};

export async function updatePost(
  client: GraphClient,
  args: { post_id: string; page_access_token: string; message: string }
) {
  const pageClient = client.withToken(args.page_access_token);
  return await pageClient.post<{ success: boolean }>(`/${args.post_id}`, {
    message: args.message,
  });
}

export const DeletePostSchema = {
  post_id: z.string().describe("Post ID"),
  page_access_token: z.string().describe("Page Access Token"),
};

export async function deletePost(
  client: GraphClient,
  args: { post_id: string; page_access_token: string }
) {
  const pageClient = client.withToken(args.page_access_token);
  return await pageClient.delete<{ success: boolean }>(`/${args.post_id}`);
}

export const GetPostInsightsSchema = {
  post_id: z.string().describe("Post ID (page_id_post_id)"),
  page_access_token: z.string().describe("Page Access Token"),
  metrics: z
    .string()
    .optional()
    .describe(
      "Comma-separated metrics. Default: post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total"
    ),
};

export async function getPostInsights(
  client: GraphClient,
  args: { post_id: string; page_access_token: string; metrics?: string }
) {
  const pageClient = client.withToken(args.page_access_token);
  const metric =
    args.metrics ??
    "post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total";
  return await pageClient.get<any>(`/${args.post_id}/insights`, { metric });
}

export const ListCommentsSchema = {
  post_id: z.string().describe("Post ID"),
  page_access_token: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(25),
};

export async function listComments(
  client: GraphClient,
  args: { post_id: string; page_access_token?: string; limit?: number }
) {
  const c = args.page_access_token
    ? client.withToken(args.page_access_token)
    : client;
  return await c.get<any>(`/${args.post_id}/comments`, {
    fields: "id,message,from,created_time,like_count,comment_count",
    limit: args.limit ?? 25,
  });
}

export const ReplyToCommentSchema = {
  comment_id: z.string().describe("Comment ID"),
  page_access_token: z.string().describe("Page Access Token"),
  message: z.string().describe("Reply text"),
};

export async function replyToComment(
  client: GraphClient,
  args: { comment_id: string; page_access_token: string; message: string }
) {
  const pageClient = client.withToken(args.page_access_token);
  return await pageClient.post<{ id: string }>(`/${args.comment_id}/comments`, {
    message: args.message,
  });
}
