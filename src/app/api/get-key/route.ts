import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pi = searchParams.get("pi");

  if (!pi) {
    return NextResponse.json({ error: "Missing payment intent ID" }, { status: 400 });
  }

  try {
    const key = await prisma.licenseKey.findFirst({
      where: {
        paymentIntentId: pi,
        status: "SOLD",
      },
      select: {
        key: true,
      },
    });

    if (!key) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    return NextResponse.json({ key: key.key });
  } catch (error) {
    console.error("Error fetching key:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}