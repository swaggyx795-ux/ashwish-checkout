import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  if (token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const keys = await prisma.licenseKey.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        key: true,
        status: true,
        buyerEmail: true,
        soldAt: true,
      },
    });

    return NextResponse.json(keys);
  } catch (error: unknown) {
    console.error("Error fetching admin keys:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}