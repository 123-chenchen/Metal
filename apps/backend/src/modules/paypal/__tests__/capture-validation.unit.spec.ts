import { validatePaypalCapture } from "../../../api/admin/payments/validate-paypal-capture"

describe("PayPal Admin capture validation", () => {
  it.each([
    ["pp_paypal_paypal", 5, false],
    ["pp_paypal_paypal", 12.5, true],
    ["pp_paypal_paypal", undefined, true],
    ["pp_sepay_sepay", 5, true],
  ])("validates %s capture of %s", async (providerId, amount, allowed) => {
    const next = jest.fn()
    const req = {
      params: { id: "pay_test" },
      validatedBody: { amount },
      scope: {
        resolve: () => ({
          retrievePayment: async () => ({
            provider_id: providerId,
            amount: 12.5,
          }),
        }),
      },
    } as unknown as Parameters<typeof validatePaypalCapture>[0]
    const result = validatePaypalCapture(
      req,
      {} as Parameters<typeof validatePaypalCapture>[1],
      next
    )
    if (allowed) {
      await result
      expect(next).toHaveBeenCalledTimes(1)
    } else {
      await expect(result).rejects.toThrow("full authorized amount")
      expect(next).not.toHaveBeenCalled()
    }
  })
})
