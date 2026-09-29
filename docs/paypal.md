# PayPal checkout

This integration uses PayPal Orders v2 with `AUTHORIZE`. The buyer approves in
PayPal, Medusa authorizes the payment while completing the cart, and the merchant
captures the full payment in Medusa Admin. Refunds can be full or partial. No
database migration or extra package is required.

## Sandbox setup

1. Sign in to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).
   Under Testing Tools / Sandbox Accounts, create a **Business** seller and a
   separate **Personal** buyer. These are test accounts, with test money.
2. Under Apps & Credentials / Sandbox, create an app linked to the Business
   sandbox seller. Get its Client ID and Secret.
3. Optional for sandbox: expose the backend with a public HTTPS URL that forwards to port 9000. In that
   PayPal app, register the webhook URL:
   `https://YOUR-BACKEND/hooks/payment/paypal_paypal`
4. If enabling webhooks, subscribe to `CHECKOUT.ORDER.APPROVED`, `PAYMENT.AUTHORIZATION.CREATED`, and
   `PAYMENT.CAPTURE.COMPLETED`. Copy the webhook's ID, not the app ID.
5. Set these variables locally using the values from the same sandbox app:

   Backend (`apps/backend/.env`):

   ```dotenv
   PAYPAL_ENABLED=true
   PAYPAL_ENVIRONMENT=sandbox
   PAYPAL_CLIENT_ID=<sandbox app client ID>
   PAYPAL_CLIENT_SECRET=<sandbox app secret>
   # Optional for sandbox; required for live.
   PAYPAL_WEBHOOK_ID=
   ```

   Storefront (`apps/storefront/.env.local`):

   ```dotenv
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=<same sandbox app client ID>
   ```

   Never put the Secret in a `NEXT_PUBLIC_` variable or commit credentials.

6. Restart the backend and storefront. In Medusa Admin, Settings / Regions,
   enable **PayPal** (`pp_paypal_paypal`) for a region using a supported currency.
   Give the products and shipping options prices in that currency.
   **VND is not supported by PayPal Checkout. Use USD for sandbox testing.**
   There is no automatic currency conversion in this integration. Supported
   currencies may also have merchant-country restrictions.
7. Checkout using the Personal sandbox buyer account, not the seller account.
   Selecting PayPal immediately prepares the session and shows its checkout
   buttons in the Payment step. Buyer approval completes the cart without a
   separate Review step. Inspect the resulting order in Medusa Admin and capture
   payment there.

PayPal is disabled by default, so existing SePay checkout works without PayPal
credentials. Enabling PayPal requires Client ID and Secret. A webhook ID is
required in live mode, but optional in sandbox. To test locally without a tunnel,
skip steps 3–4 and leave `PAYPAL_WEBHOOK_ID` empty. Keep checkout open until the
order confirmation appears; automatic recovery after closing the page requires
a configured webhook. Incoming webhooks are rejected when no webhook ID is set.
If enabling webhooks, fill `PAYPAL_WEBHOOK_ID` with the ID from step 4 and restart.

## Behavior and verification

- The backend creates the PayPal order from Medusa's total, in major currency
  units. Amounts are not divided by 100. JPY, HUF and TWD require integer amounts.
- Only the server authorizes, captures, voids and refunds. A browser callback is
  not proof of payment. The server reads the PayPal order and checks its session,
  amount and currency before authorization.
- Changing cart totals creates a new PayPal order and requires fresh approval.
- API mutations use deterministic PayPal request IDs. Repeated capture callbacks
  inspect the existing capture before attempting another capture.
- Webhooks are verified through PayPal's signature verification API, then the
  actual order is fetched. Medusa's payment workflow handles order completion
  and captured-payment reconciliation. The built-in webhook endpoint queues work;
  an HTTP 200 alone is not proof the payment was processed. Check worker logs.
- Closing PayPal before approval leaves the cart available to retry. Closing the
  store after approval can still complete the order through the verified webhook.
- Void an uncaptured authorization with the Admin cancellation flow. Captured
  funds must be refunded. Perform captures and refunds through Medusa Admin;
  external refunds, disputes and reversals are not synchronized by this provider.
- Capture the **full** authorized amount; the Admin API rejects partial captures.
  Custom workflows must also request full captures, since Medusa 2.19 does not
  pass the capture amount to providers.
  Authorization expiry and PayPal's capture eligibility still apply.
- A pending capture/refund is not recorded as completed. If a request times out
  or a refund is pending, check the PayPal transaction before creating another
  refund in Admin: a new refund operation has a new idempotency key. This is
  particularly important for an ambiguous network failure after PayPal accepted it.
- PayPal's simulated webhook events cannot use postback signature verification.
  Test using real sandbox buyer transactions and webhook resends instead.

Manual sandbox acceptance checklist (requires the credentials above):

- Successful approval creates one order with an authorized payment.
- Capture in Admin shows completed in both systems; resend its webhook and
  confirm no duplicate order or capture.
- Cancel the PayPal popup, retry, then change quantities/shipping and confirm the
  new PayPal amount matches the cart.
- Try calling cart completion without approving PayPal: no paid order is created.
- Void an authorized payment. On another order, capture and perform two separate
  partial refunds, then verify the refunded total on both sides.
- Close the storefront after approval and verify webhook recovery.
- Reject unsigned webhooks and confirm a VND cart cannot initiate PayPal payment.

Automated tests mock PayPal APIs; they do not replace this sandbox checklist.

## Live deployment

Use a verified Business merchant account, its **live** app credentials and live
webhook ID, set `PAYPAL_ENVIRONMENT=live`, and rebuild the storefront with the
matching public Client ID. Keep the webhook publicly reachable over HTTPS and
use reliable Medusa event processing. Complete the sandbox checklist first.

References: [Medusa payment provider](https://docs.medusajs.com/resources/commerce-modules/payment/payment-provider),
[PayPal Checkout](https://developer.paypal.com/studio/checkout/standard/getstarted),
[webhook verification](https://developer.paypal.com/api/rest/webhooks/rest/),
[currencies](https://developer.paypal.com/api/codes/currency/).
