import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  try {
    // Check if there are ANY available keys left BEFORE creating intent
    const availableKeys = await prisma.licenseKey.count({
      where: { status: "AVAILABLE" },
    });

    if (availableKeys === 0) {
      return NextResponse.json(
        { error: "Out of stock" },
        { status: 400 }
      );
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1.00 USD
      currency: "usd",
      // In the latest api, automatic_payment_methods is enabled by default.
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        product: "ashwish_ui",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: unknown) {
    console.error("Error creating payment intent:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create payment intent";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}