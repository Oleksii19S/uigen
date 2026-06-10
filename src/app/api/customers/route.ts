import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    const lastCustomer = await prisma.customer.findFirst({
      orderBy: { id: "desc" },
    });
    const nextIndex = lastCustomer
      ? parseInt(lastCustomer.id.replace("u_", ""), 10) + 1
      : 0;
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
