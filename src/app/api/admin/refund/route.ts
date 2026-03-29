import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { keyId, password } = await req.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!keyId) {
      return NextResponse.json({ error: "Missing key ID" }, { status: 400 });
    }

    // Start a transaction to process the refund and update the database
    await prisma.$transaction(async (tx) => {
      const keyRecord = await tx.licenseKey.findUnique({
        where: { id: keyId },
      });

      if (!keyRecord || keyRecord.status !== "SOLD" || !keyRecord.paymentIntentId) {
        throw new Error("Invalid key state for refund");
      }

      // Trigger Stripe Refund
      const refund = await stripe.refunds.create({
        payment_intent: keyRecord.paymentIntentId,
        reason: "requested_by_customer",
      });

      if (refund.status === "failed") {
        throw new Error("Stripe refund failed");
      }

      // Restore Key Status to AVAILABLE
      await tx.licenseKey.update({
        where: { id: keyId },
        data: {
          status: "AVAILABLE",
          buyerEmail: null,
          paymentIntentId: null,
          soldAt: null,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Refund error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process refund";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}