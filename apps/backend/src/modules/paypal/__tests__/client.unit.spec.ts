import PaypalClient, { requestId } from "../client"

describe("PayPal HTTP client", () => {
  const options = {
    clientId: "test-id",
    clientSecret: "test-secret",
    webhookId: "test-webhook",
    environment: "sandbox" as const,
  }
  afterEach(() => jest.restoreAllMocks())

  it("uses sandbox, caches OAuth, and sends stable bounded idempotency keys", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "token", expires_in: 3600 })
        )
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "ORDER1" })))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    const client = new PaypalClient(options)
    await client.request("/v2/checkout/orders", "POST", {}, "create:payses_1")
    await client.request(
      "/v2/payments/authorizations/AUTH1/void",
      "POST",
      {},
      "void:AUTH1"
    )
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api-m.sandbox.paypal.com/v1/oauth2/token"
    )
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({
      "PayPal-Request-Id": requestId("create:payses_1"),
    })
    expect(requestId("create:payses_1").length).toBeLessThanOrEqual(38)
  })

  it("does not expose credentials or PayPal response bodies in errors", async () => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "token", expires_in: 3600 })
        )
      )
      .mockResolvedValueOnce(
        new Response("private payer details", {
          status: 422,
          headers: { "paypal-debug-id": "debug123" },
        })
      )
    await expect(
      new PaypalClient(options).request("/v2/checkout/orders")
    ).rejects.toThrow("PayPal request failed (422); reference debug123.")
  })
})
