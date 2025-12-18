import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "../../../Backend/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: {
                supabaseId: user.id,
            },
            select: {
                stripePriceId: true,
                stripeSubscriptionId: true,
                stripeCurrentPeriodEnd: true,
            },
        });

        if (!dbUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        return NextResponse.json(dbUser);
    } catch (error) {
        console.error("[SUBSCRIPTION_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
