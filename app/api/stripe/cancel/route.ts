import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { subscriptionId } = await req.json();

        if (!subscriptionId) {
            return new NextResponse("Subscription ID is required", { status: 400 });
        }

        const dbUser = await prisma.user.findUnique({
            where: {
                supabaseId: user.id,
            },
        });

        if (!dbUser || dbUser.stripeSubscriptionId !== subscriptionId) {
            return new NextResponse("Invalid subscription", { status: 403 });
        }

        try {
            await stripe.subscriptions.cancel(subscriptionId);
        } catch (error) {
            console.error("Stripe cancel error:", error);
            return new NextResponse("Stripe cancellation failed", { status: 500 });
        }

        await prisma.user.update({
            where: {
                id: dbUser.id
            },
            data: {
                stripeSubscriptionStatus: "canceled",
            }
        })

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[SUBSCRIPTION_CANCEL]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
