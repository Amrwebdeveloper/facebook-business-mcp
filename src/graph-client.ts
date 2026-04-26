/**
 * Facebook Graph API Client
 * Handles all requests to the Graph API with proper error handling.
 */

const DEFAULT_API_VERSION = "v21.0";
const GRAPH_BASE_URL = "https://graph.facebook.com";

export interface GraphErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

export class FacebookGraphError extends Error {
  public code?: number;
  public type?: string;
  public subcode?: number;
  public fbtrace_id?: string;
  public status: number;

  constructor(message: string, status: number, body?: GraphErrorBody) {
    super(message);
    this.name = "FacebookGraphError";
    this.status = status;
    if (body?.error) {
      this.code = body.error.code;
      this.type = body.error.type;
      this.subcode = body.error.error_subcode;
      this.fbtrace_id = body.error.fbtrace_id;
    }
  }
}

export interface GraphClientOptions {
  accessToken: string;
  apiVersion?: string;
}

type Params = Record<string, string | number | boolean | undefined | null>;

export class GraphClient {
  private accessToken: string;
  private apiVersion: string;

  constructor(opts: GraphClientOptions) {
    if (!opts.accessToken) {
      throw new Error(
        "FB_ACCESS_TOKEN is not set. Please configure it as an environment variable before running the MCP server."
      );
    }
    this.accessToken = opts.accessToken;
    this.apiVersion = opts.apiVersion ?? DEFAULT_API_VERSION;
  }

  private buildUrl(path: string, params?: Params): string {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const url = new URL(`${GRAPH_BASE_URL}/${this.apiVersion}/${cleanPath}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== "") {
          url.searchParams.set(k, String(v));
        }
      }
    }
    return url.toString();
  }

  /**
   * GET request
   */
  async get<T = any>(path: string, params?: Params): Promise<T> {
    const merged: Params = { access_token: this.accessToken, ...(params ?? {}) };
    const url = this.buildUrl(path, merged);
    const res = await fetch(url, { method: "GET" });
    return this.handleResponse<T>(res);
  }

  /**
   * POST request — uses application/x-www-form-urlencoded by default.
   */
  async post<T = any>(path: string, body?: Params): Promise<T> {
    const url = this.buildUrl(path);
    const formBody = new URLSearchParams();
    formBody.set("access_token", this.accessToken);
    if (body) {
      for (const [k, v] of Object.entries(body)) {
        if (v !== undefined && v !== null && v !== "") {
          formBody.set(k, String(v));
        }
      }
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody.toString(),
    });
    return this.handleResponse<T>(res);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(path: string, params?: Params): Promise<T> {
    const merged: Params = { access_token: this.accessToken, ...(params ?? {}) };
    const url = this.buildUrl(path, merged);
    const res = await fetch(url, { method: "DELETE" });
    return this.handleResponse<T>(res);
  }

  /**
   * Fetches all pages of a paginated endpoint.
   */
  async getAllPages<T = any>(
    path: string,
    params?: Params,
    maxPages = 10
  ): Promise<T[]> {
    const all: T[] = [];
    let next: string | null = this.buildUrl(path, {
      access_token: this.accessToken,
      ...(params ?? {}),
    });
    let pages = 0;
    while (next && pages < maxPages) {
      const res = await fetch(next);
      const json: any = await this.handleResponse(res);
      if (Array.isArray(json?.data)) all.push(...json.data);
      next = json?.paging?.next ?? null;
      pages++;
    }
    return all;
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    let text: string;
    try {
      text = await res.text();
    } catch {
      throw new FacebookGraphError(
        "Failed to read response body from server",
        res.status
      );
    }
    let json: any = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        // not JSON
      }
    }
    if (!res.ok) {
      const body = json as GraphErrorBody | null;
      const msg = body?.error?.message ?? `Request failed (${res.status})`;
      throw new FacebookGraphError(msg, res.status, body ?? undefined);
    }
    return (json ?? text) as T;
  }

  /**
   * Returns a new client with the same settings but a different token
   * (useful for switching between User Token and Page Access Token).
   */
  withToken(newToken: string): GraphClient {
    return new GraphClient({
      accessToken: newToken,
      apiVersion: this.apiVersion,
    });
  }
}

/**
 * Helper to format errors with actionable hints for the LLM.
 */
export function formatGraphError(err: unknown): string {
  if (err instanceof FacebookGraphError) {
    const parts = [`Facebook Graph API error: ${err.message}`];
    if (err.code) parts.push(`Code: ${err.code}`);
    if (err.type) parts.push(`Type: ${err.type}`);
    if (err.subcode) parts.push(`Subcode: ${err.subcode}`);
    if (err.status) parts.push(`HTTP: ${err.status}`);
    if (err.fbtrace_id) parts.push(`Trace: ${err.fbtrace_id}`);

    // Suggestions based on common error codes
    if (err.code === 190) {
      parts.push(
        "💡 Hint: The access token is invalid or expired. Generate a fresh one from Graph API Explorer."
      );
    } else if (err.code === 200 || err.code === 10) {
      parts.push(
        "💡 Hint: The token lacks the required permissions. Make sure to include scopes like pages_manage_posts, ads_management, etc."
      );
    } else if (err.code === 100) {
      parts.push(
        "💡 Hint: Check the IDs and parameters being passed — one of them may be invalid."
      );
    } else if (err.code === 4 || err.code === 17 || err.code === 32) {
      parts.push(
        "💡 Hint: You hit a rate limit. Wait a moment and retry."
      );
    }
    return parts.join(" | ");
  }
  if (err instanceof Error) return `Error: ${err.message}`;
  return `Unknown error: ${String(err)}`;
}
