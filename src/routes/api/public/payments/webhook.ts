import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

async function handle(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  const { markBookingPaid, markBookingRefunded, deleteUnpaidBySession } = await import("@/lib/bookings.server");
  const obj = event.data.object;
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const bookingId = obj.metadata?.bookingId;
      if (bookingId && obj.payment_status === "paid") {
        await markBookingPaid(bookingId, typeof obj.payment_intent === "string" ? obj.payment_intent : null, env);
      }
      break;
    }
    case "checkout.session.expired": {
      if (obj.id) await deleteUnpaidBySession(obj.id);
      break;
    }
    case "charge.refunded": {
      const pi = typeof obj.payment_intent === "string" ? obj.payment_intent : null;
      if (pi && obj.refunded) await markBookingRefunded(pi);
      break;
    }
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") return Response.json({ received: true, ignored: "invalid env" });
        try {
          await handle(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
