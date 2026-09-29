"use client"

import Script from "next/script"
import { useEffect, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { placeOrder } from "@lib/data/cart"
import { Button } from "@modules/common/components/ui"
import ErrorMessage from "../error-message"

type PaypalSdk = {
  Buttons: (options: {
    createOrder: () => Promise<string>
    onApprove: (data: { orderID: string }) => Promise<void>
    onCancel: () => void
    onError: () => void
    style: { layout: "vertical" }
  }) => {
    render: (element: HTMLElement) => Promise<void>
    close: () => Promise<void>
  }
}

export default function PaypalPaymentButton({
  cart,
  notReady,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
}) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const currency = cart.currency_code.toUpperCase()
  const namespace = `metalPaypal${currency}`
  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.provider_id === "pp_paypal_paypal"
  )
  const orderId =
    typeof session?.data?.id === "string" ? session.data.id : undefined
  const [ready, setReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [approved, setApproved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const container = useRef<HTMLDivElement>(null)
  const inFlight = useRef(false)

  const complete = async () => {
    if (inFlight.current) return
    inFlight.current = true
    setSubmitting(true)
    setError(null)
    try {
      // Medusa authorizes server-side, verifies the amount and completes the cart.
      const remainingCart = await placeOrder()
      if (remainingCart)
        setError(
          "Your order could not be completed. Please retry or contact the store."
        )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not complete your order. Please retry."
      )
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }
  const completeRef = useRef(complete)
  completeRef.current = complete

  useEffect(() => {
    setApproved(false)
    setError(null)
  }, [orderId])

  useEffect(() => {
    if (!ready || notReady || !orderId || !container.current) return
    const sdk = (window as unknown as Record<string, PaypalSdk>)[namespace]
    if (!sdk) return
    const buttons = sdk.Buttons({
      style: { layout: "vertical" },
      createOrder: async () => orderId,
      onApprove: async (data) => {
        if (data.orderID !== orderId) {
          setError("Payment session changed. Refresh checkout and try again.")
          return
        }
        setApproved(true)
        await completeRef.current()
      },
      onCancel: () =>
        setError("PayPal checkout was canceled. You can try again."),
      onError: () =>
        setError(
          "PayPal is unavailable. Please refresh checkout and try again."
        ),
    })
    void buttons
      .render(container.current)
      .catch(() => setError("Could not load the PayPal payment button."))
    return () => {
      void buttons.close().catch(() => {})
    }
  }, [ready, notReady, orderId, namespace])

  if (!clientId)
    return (
      <ErrorMessage error="PayPal is not configured yet. Please choose another payment method." />
    )

  return (
    <div className="w-full" data-testid="paypal-payment-button">
      <Script
        id={`paypal-sdk-${currency}`}
        src={`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${currency}&intent=authorize&components=buttons`}
        data-namespace={namespace}
        onReady={() => setReady(true)}
        onError={() =>
          setError(
            "Could not load PayPal. Check your connection and refresh the page."
          )
        }
      />
      {!ready && !error && <p role="status">Loading PayPal…</p>}
      {notReady && <p>Complete your address and shipping method first.</p>}
      {!orderId && <p>Please select PayPal again in the payment step.</p>}
      <div ref={container} className={approved || submitting ? "hidden" : ""} />
      {approved && (
        <Button
          onClick={complete}
          disabled={notReady || submitting}
          isLoading={submitting}
        >
          Complete order
        </Button>
      )}
      <ErrorMessage error={error} data-testid="paypal-payment-error-message" />
    </div>
  )
}
