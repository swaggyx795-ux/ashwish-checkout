import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("Stripe-Signature");

  let event: Stripe.Event;

  try {
    // Note: To test webhooks locally, we need STRIPE_WEBHOOK_SECRET.
    // In a production environment with a valid webhook secret, we use constructEvent.
    // For test mode without webhook secret configured locally, we can construct the event manually
    // or parse the body if STRIPE_WEBHOOK_SECRET isn't present.
    if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      // Fallback for development if webhook secret is not set up
      event = JSON.parse(payload);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook Error: ${message}`);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // Handle the payment_intent.succeeded event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const piId = paymentIntent.id;
    // We try to extract email from latest charge or payment method billing details, or receipt_email
    const buyerEmail = paymentIntent.receipt_email ||
                       (paymentIntent.latest_charge as { billing_details?: { email?: string } })?.billing_details?.email ||
                       "unknown@example.com";

    try {
      // Start a transaction to ensure atomic update
      await prisma.$transaction(async (tx) => {
        // Find one available key and lock it by updating its status
        // SQLite doesn't support traditional row-level locking (SELECT ... FOR UPDATE)
        // so we use an optimistic/direct update approach

        const availableKey = await tx.licenseKey.findFirst({
          where: { status: "AVAILABLE" },
          orderBy: { createdAt: "asc" }, // Just grab the oldest one
        });

        if (!availableKey) {
          // RACE CONDITION CAUGHT: Payment succeeded, but 0 keys available.
          throw new Error("OUT_OF_STOCK_RACE_CONDITION");
        }

        // Atomically claim THIS exact key. If someone else claimed it a millisecond ago,
        // this will update 0 rows, which we could verify, but SQLite handles write transactions sequentially.
        await tx.licenseKey.update({
          where: { id: availableKey.id, status: "AVAILABLE" },
          data: {
            status: "SOLD",
            paymentIntentId: piId,
            buyerEmail: buyerEmail,
            soldAt: new Date(),
          },
        });
      });

      console.log(`Successfully sold a key for PaymentIntent: ${piId}`);

    } catch (error: unknown) {
      console.error("Error claiming key:", error);
      const isRaceCondition = error instanceof Error && error.message === "OUT_OF_STOCK_RACE_CONDITION" || (error as { code?: string }).code === "P2025";

      if (isRaceCondition) {
        // Automatic Refund Logic
        console.log(`Triggering automatic refund for PaymentIntent ${piId} due to race condition`);
        try {
          await stripe.refunds.create({
            payment_intent: piId,
            reason: "fraudulent", // Stripe doesn't have an "out_of_stock" reason enum, use an acceptable one or omit
          });
          console.log(`Refund successful for ${piId}`);
        } catch (refundError) {
          console.error(`CRITICAL: Failed to automatically refund ${piId}`, refundError);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}