import { useCallback } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";

/** Mount once per checkout; fetchSecret must return the session's client secret. */
export function BookingEmbeddedCheckout({ fetchSecret }: { fetchSecret: () => Promise<string> }) {
  const fetchClientSecret = useCallback(fetchSecret, [fetchSecret]);
  return (
    <div id="checkout" className="min-h-[400px]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
