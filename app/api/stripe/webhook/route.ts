import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
        console.log("Webhook received:", event.type);
    } catch (error: any) {
        console.error("Webhook signature verification failed:", error.message);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === "checkout.session.completed") {
        if (!session.subscription) {
            return new NextResponse("Missing subscription in checkout session", { status: 400 });
        }
        console.log("Processing checkout.session.completed");

        const subscription = (await stripe.subscriptions.retrieve(
            session.subscription as string
        )) as Stripe.Subscription;

        console.log("Subscription data:", JSON.stringify(subscription, null, 2));

        if (!session?.metadata?.userId) {
            return new NextResponse("User id is required", { status: 400 });
        }

        const periodEnd = (subscription as any).current_period_end
            ? new Date((subscription as any).current_period_end * 1000)
            : new Date();

        await prisma.user.update({
            where: {
                id: session.metadata.userId,
            },
            data: {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                stripePriceId: subscription.items.data[0].price.id,
                stripeSubscriptionStatus: subscription.status,
                stripeCurrentPeriodEnd: periodEnd,
            },
        });
    }

    if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as Stripe.Invoice;

        if (!(invoice as any).subscription) {
            console.warn("Invoice missing subscription ID:", invoice.id);
            return new NextResponse(null, { status: 200 });
        }

        const subscription = (await stripe.subscriptions.retrieve(
            (invoice as any).subscription as string
        )) as Stripe.Subscription;

        const periodEnd = (subscription as any).current_period_end
            ? new Date((subscription as any).current_period_end * 1000)
            : new Date();

        // Since stripeSubscriptionId is not unique in schema, we must find the user first
        const userToUpdate = await prisma.user.findFirst({
            where: { stripeSubscriptionId: subscription.id }
        });

        if (userToUpdate) {
            await prisma.user.update({
                where: { id: userToUpdate.id },
                data: {
                    stripePriceId: subscription.items.data[0].price.id,
                    stripeSubscriptionStatus: subscription.status,
                    stripeCurrentPeriodEnd: periodEnd,
                },
            });
        }
    }

    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;

        const userToCancel = await prisma.user.findFirst({
            where: { stripeSubscriptionId: subscription.id }
        });

        if (userToCancel) {
            await prisma.user.update({
                where: { id: userToCancel.id },
                data: {
                    stripeSubscriptionStatus: subscription.status,
                    stripePriceId: null,
                },
            });
        }
    }

    return new NextResponse(null, { status: 200 });
}
