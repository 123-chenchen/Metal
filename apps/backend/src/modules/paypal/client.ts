import { MedusaError } from "@medusajs/framework/utils"
import { createHash } from "node:crypto"

export type PaypalOptions = {
  clientId: string
  clientSecret: string
  environment: "sandbox" | "live"
  webhookId?: string
}

export const requestId = (value: string) =>
  createHash("sha256").update(value).digest("hex").slice(0, 38)

export default class PaypalClient {
  private token?: { value: string; expires: number }
  private readonly baseUrl: string

  constructor(private readonly options: PaypalOptions) {
    this.baseUrl =
      options.environment === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com"
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expires > Date.now()) return this.token.value
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.options.clientId}:${this.options.clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok)
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "PayPal authentication failed. Check the server credentials and environment."
      )
    const data = (await response.json()) as {
      access_token: string
      expires_in: number
    }
    this.token = {
      value: data.access_token,
      expires: Date.now() + (data.expires_in - 60) * 1000,
    }
    return data.access_token
  }

  async request<T>(
    path: string,
    method = "GET",
    body?: unknown,
    key?: string
  ): Promise<T> {
    const token = await this.accessToken()
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(key ? { "PayPal-Request-Id": requestId(key) } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    })
    if (!response.ok) {
      if (response.status === 401) this.token = undefined
      // Do not expose payer details, credentials or raw API responses.
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `PayPal request failed (${response.status}); reference ${response.headers.get("paypal-debug-id") || "unavailable"}.`
      )
    }
    return response.status === 204 ? ({} as T) : ((await response.json()) as T)
  }
}
