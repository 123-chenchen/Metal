import PaypalProviderService, { paypalMoney } from "../service"
import PaypalClient from "../client"
import { BigNumber } from "@medusajs/framework/utils"

const options = {
  clientId: "test",
  clientSecret: "test",
  environment: "sandbox" as const,
  webhookId: "WH-test",
}
const data = {
  id: "ORDER1",
  session_id: "payses_test",
  amount: "12.50",
  currency_code: "USD",
}
const amount = { value: "12.50", currency_code: "USD" }
const authorization = { id: "AUTH1", status: "CREATED", amount }
const capture = { id: "CAPTURE1", status: "COMPLETED", amount }
function order(status = "CREATED", payments = {}) {
  return {
    id: "ORDER1",
    intent: "AUTHORIZE",
    status,
    purchase_units: [{ custom_id: "payses_test", amount, payments }],
  }
}

describe("PayPal provider", () => {
  let provider: PaypalProviderService
  let request: jest.SpyInstance
  beforeEach(() => {
    provider = new PaypalProviderService({}, options)
    request = jest.spyOn(PaypalClient.prototype, "request")
  })
  afterEach(() => jest.restoreAllMocks())

  it("fails configuration explicitly and never defaults an invalid environment to live", () => {
    expect(() => PaypalProviderService.validateOptions({})).toThrow("requires")
    expect(() =>
      PaypalProviderService.validateOptions({
        ...options,
        environment: "production",
      })
    ).toThrow("sandbox or live")
  })

  it.each([undefined, "", "   "])(
    "allows sandbox without webhook ID (%s), but rejects live",
    (webhookId) => {
      expect(() =>
        PaypalProviderService.validateOptions({ ...options, webhookId })
      ).not.toThrow()
      expect(() =>
        PaypalProviderService.validateOptions({
          ...options,
          environment: "live",
          webhookId,
        })
      ).toThrow("live requires webhookId")
    }
  )

  it("authorizes sandbox checkout without a webhook configured", async () => {
    provider = new PaypalProviderService(
      {},
      { ...options, webhookId: undefined }
    )
    request
      .mockResolvedValueOnce(order("APPROVED"))
      .mockResolvedValueOnce(
        order("COMPLETED", { authorizations: [authorization] })
      )
    expect((await provider.authorizePayment({ data })).status).toBe(
      "authorized"
    )
  })

  it("uses major currency units and rejects VND and invalid precision", () => {
    expect(paypalMoney(12.5, "usd")).toEqual(amount)
    expect(paypalMoney(100, "jpy").value).toBe("100")
    for (const [value, currency] of [
      [100, "vnd"],
      [1.1, "jpy"],
      [1.001, "usd"],
      [0, "usd"],
      [-1, "usd"],
    ] as const) {
      expect(() => paypalMoney(value, currency)).toThrow()
    }
  })

  it("creates a server-owned amount and session reference, ignoring supplied transaction data", async () => {
    request.mockResolvedValue(order())
    const result = await provider.initiatePayment({
      amount: 12.5,
      currency_code: "usd",
      data: { ...data, amount: "0.01", capture_id: "forged" },
    })
    expect(result.data).toEqual(data)
    expect(request).toHaveBeenCalledWith(
      "/v2/checkout/orders",
      "POST",
      expect.objectContaining({
        intent: "AUTHORIZE",
        purchase_units: [
          { reference_id: "default", custom_id: "payses_test", amount },
        ],
      }),
      "create:payses_test:initial:USD:12.50"
    )
  })

  it("does not authorize an order the buyer has not approved", async () => {
    request.mockResolvedValue(order())
    expect((await provider.authorizePayment({ data })).status).toBe(
      "requires_more"
    )
    expect(request).toHaveBeenCalledTimes(1)
  })

  it("authorizes approved orders server-side with a stable retry key", async () => {
    request
      .mockResolvedValueOnce(order("APPROVED"))
      .mockResolvedValueOnce(
        order("COMPLETED", { authorizations: [authorization] })
      )
    expect(
      (
        await provider.authorizePayment({
          data,
          context: { idempotency_key: "payses_test" },
        })
      ).status
    ).toBe("authorized")
    expect(request).toHaveBeenLastCalledWith(
      "/v2/checkout/orders/ORDER1/authorize",
      "POST",
      {},
      "authorize:ORDER1"
    )
  })

  it("recovers an authorization after a lost response without authorizing twice", async () => {
    request.mockResolvedValue(
      order("COMPLETED", { authorizations: [authorization] })
    )
    expect((await provider.authorizePayment({ data })).status).toBe(
      "authorized"
    )
    expect(request).toHaveBeenCalledTimes(1)
  })

  it.each([
    { ...data, amount: "1.00" },
    { ...data, currency_code: "EUR" },
    { ...data, session_id: "payses_other" },
  ])(
    "rejects an order that does not match the payment session",
    async (invalid) => {
      request.mockResolvedValue(order("APPROVED"))
      await expect(
        provider.authorizePayment({ data: invalid })
      ).rejects.toThrow("does not match")
      expect(request).toHaveBeenCalledTimes(1)
    }
  )

  it("binds authorization to Medusa's trusted session context", async () => {
    request.mockResolvedValue(order("APPROVED"))
    await expect(
      provider.authorizePayment({
        data,
        context: { idempotency_key: "payses_other" },
      })
    ).rejects.toThrow("does not match")
  })

  it("creates a new order when the cart amount changes", async () => {
    request
      .mockResolvedValueOnce(order())
      .mockResolvedValueOnce({ ...order(), id: "ORDER2" })
    const result = await provider.updatePayment({
      data,
      amount: 20,
      currency_code: "usd",
    })
    expect(result.data).toMatchObject({ id: "ORDER2", amount: "20.00" })
    expect(request.mock.calls[1][3]).toBe("create:payses_test:ORDER1:USD:20.00")
  })

  it("keeps the approved order when the amount is unchanged", async () => {
    expect(
      await provider.updatePayment({ data, amount: 12.5, currency_code: "usd" })
    ).toEqual({ data })
    expect(request).not.toHaveBeenCalled()
  })

  it("captures only an authorized payment, with an idempotent request", async () => {
    request
      .mockResolvedValueOnce(
        order("COMPLETED", { authorizations: [authorization] })
      )
      .mockResolvedValueOnce(capture)
    expect((await provider.capturePayment({ data })).data.capture_id).toBe(
      "CAPTURE1"
    )
    expect(request).toHaveBeenLastCalledWith(
      "/v2/payments/authorizations/AUTH1/capture",
      "POST",
      { final_capture: true },
      "capture:AUTH1"
    )
  })

  it("never treats a pending capture as paid", async () => {
    request
      .mockResolvedValueOnce(
        order("COMPLETED", { authorizations: [authorization] })
      )
      .mockResolvedValueOnce({ ...capture, status: "PENDING" })
    await expect(provider.capturePayment({ data })).rejects.toThrow(
      "not completed"
    )
  })

  it("does not capture again when processing a repeated capture webhook", async () => {
    request.mockResolvedValue(order("COMPLETED", { captures: [capture] }))
    expect((await provider.capturePayment({ data })).data.capture_id).toBe(
      "CAPTURE1"
    )
    expect(request).toHaveBeenCalledTimes(1)
  })

  it("supports separate partial refunds of the same amount with distinct retry keys", async () => {
    request
      .mockResolvedValueOnce(order("COMPLETED"))
      .mockResolvedValueOnce({ id: "REF1", status: "COMPLETED" })
      .mockResolvedValueOnce(order("COMPLETED"))
      .mockResolvedValueOnce({ id: "REF2", status: "COMPLETED" })
    for (const id of ["refund1", "refund2"]) {
      await provider.refundPayment({
        data: { ...data, capture_id: "CAPTURE1" },
        amount: 2,
        context: { idempotency_key: id },
      })
    }
    expect(request.mock.calls[1]).toEqual([
      "/v2/payments/captures/CAPTURE1/refund",
      "POST",
      { amount: { currency_code: "USD", value: "2.00" } },
      "refund:refund1",
    ])
    expect(request.mock.calls[3][3]).toBe("refund:refund2")
  })

  it.each([data, {}, undefined])(
    "cleans up a cart payment session without contacting PayPal (%j)",
    async (sessionData) => {
      request.mockRejectedValue(new Error("PayPal order is unavailable"))

      await expect(
        provider.deletePayment({ data: sessionData })
      ).resolves.toEqual({ data: sessionData })
      expect(request).not.toHaveBeenCalled()
    }
  )

  it("voids an authorization and refuses to cancel captured funds", async () => {
    request
      .mockResolvedValueOnce(
        order("COMPLETED", { authorizations: [authorization] })
      )
      .mockResolvedValueOnce({})
    await provider.cancelPayment({ data })
    expect(request).toHaveBeenLastCalledWith(
      "/v2/payments/authorizations/AUTH1/void",
      "POST",
      {},
      "void:AUTH1"
    )
    request.mockResolvedValue(order("COMPLETED", { captures: [capture] }))
    await expect(provider.cancelPayment({ data })).rejects.toThrow(
      "must be refunded"
    )
  })

  const payload = {
    data: {
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: { supplementary_data: { related_ids: { order_id: "ORDER1" } } },
    },
    rawData: "",
    headers: Object.fromEntries(
      [
        "auth-algo",
        "cert-url",
        "transmission-id",
        "transmission-sig",
        "transmission-time",
      ].map((name) => [`paypal-${name}`, "test"])
    ),
  }

  it("rejects webhooks without a configured ID before making API calls", async () => {
    provider = new PaypalProviderService(
      {},
      { ...options, webhookId: undefined }
    )
    await expect(provider.getWebhookActionAndData(payload)).rejects.toThrow(
      "webhook processing is disabled"
    )
    expect(request).not.toHaveBeenCalled()
  })

  it("rejects unsigned and forged webhooks before reading orders", async () => {
    await expect(
      provider.getWebhookActionAndData({ ...payload, headers: {} })
    ).rejects.toThrow("signature headers")
    expect(request).not.toHaveBeenCalled()
    request.mockResolvedValue({ verification_status: "FAILURE" })
    await expect(provider.getWebhookActionAndData(payload)).rejects.toThrow(
      "Invalid PayPal webhook"
    )
    expect(request).toHaveBeenCalledTimes(1)
  })

  it("verifies the signature and re-reads the actual order for capture webhooks", async () => {
    request
      .mockResolvedValueOnce({ verification_status: "SUCCESS" })
      .mockResolvedValueOnce(order("COMPLETED", { captures: [capture] }))
    const result = await provider.getWebhookActionAndData(payload)
    expect(result.action).toBe("captured")
    expect(result.data?.session_id).toBe("payses_test")
    expect(new BigNumber(result.data!.amount).numeric).toBe(12.5)
    expect(request.mock.calls[0][2]).toMatchObject({
      webhook_id: "WH-test",
      webhook_event: payload.data,
    })
  })

  it("ignores pending and unsupported webhook events", async () => {
    request.mockResolvedValueOnce({ verification_status: "SUCCESS" })
    expect(
      await provider.getWebhookActionAndData({
        ...payload,
        data: { event_type: "PAYMENT.CAPTURE.PENDING" },
      })
    ).toEqual({ action: "not_supported" })
    expect(request).toHaveBeenCalledTimes(1)
  })
})
