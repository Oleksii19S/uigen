import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const creation_date = new Date().toISOString().split("T")[0];

    const count = await prisma.customer.count();
    if (count >= 5) {
      return NextResponse.json(
        { error: "Maximum of 5 customers reached. No more records can be added." },
        { status: 422 }
      );
    }

    const allIds = (await prisma.customer.findMany({ select: { id: true } }))
      .map((c) => parseInt(c.id.replace("u_", ""), 10))
      .filter((n) => !isNaN(n));
    const nextIndex = allIds.length > 0 ? Math.max(...allIds) + 1 : 0;

    if (nextIndex > 99) {
      return NextResponse.json(
        { error: "ID limit reached. Maximum allowed ID is u_99." },
        { status: 422 }
      );
    }

    const id = `u_${String(nextIndex).padStart(2, "0")}`;

    const customer = await prisma.customer.create({
      data: { id, email, password, creation_date },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Failed to create customer:", error);
    return NextResponse.json(
      { error: "Failed to save customer" },
      { status: 500 }
    );
  }
}
