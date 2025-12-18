import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PricingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PricingDialog({ open, onOpenChange }: PricingDialogProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [currentPriceId, setCurrentPriceId] = useState<string | null>(null);
    const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
    const [isFetchingSubscription, setIsFetchingSubscription] = useState(false);

    // Fetch subscription status when dialog opens
    // We can use SWR or React Query here ideally, but for simplicity a useEffect works
    useEffect(() => {
        if (open) {
            setIsFetchingSubscription(true);
            fetch("/api/subscription")
                .then((res) => {
                    if (res.ok) return res.json();
                    return null;
                })
                .then((data) => {
                    if (data) {
                        setCurrentPriceId(data.stripePriceId);
                        setSubscriptionId(data.stripeSubscriptionId);
                    }
                })
                .catch(console.error)
                .finally(() => {
                    setIsFetchingSubscription(false);
                });
        }
    }, [open]);

    const plans = [
        {
            id: "monthly",
            name: "Monthly",
            price: "$13",
            period: "/month",
            billing: "Billed monthly",
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY,
            features: [
                "Unlimited URL submissions",
                "Priority support",
                "Advanced analytics",
            ],
        },
        {
            id: "yearly",
            name: "Yearly",
            price: "$7",
            period: "/month",
            billing: "Billed $84 yearly",
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_YEARLY,
            popular: true,
            features: [
                "Everything in Monthly",
                "Save 46%",
                "Priority support",
                "Advanced analytics",
            ],
        },
    ];

    const handleCancel = async () => {
        if (!subscriptionId) return;
        setIsLoading("cancel");
        try {
            const response = await fetch("/api/stripe/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscriptionId }),
            });

            if (!response.ok) throw new Error("Failed to cancel");

            toast.success("Subscription canceled");
            setCurrentPriceId(null);
            setSubscriptionId(null);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to cancel subscription");
        } finally {
            setIsLoading(null);
        }
    };

    const handleSubscribe = async (priceId: string | undefined, planId: string) => {
        if (!priceId) {
            toast.error("Price ID not configured");
            return;
        }

        setIsLoading(planId);
        try {
            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    priceId,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to start checkout");
            }

            const data = await response.json();
            window.location.href = data.url;
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again.");
            setIsLoading(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">
                        Upgrade your plan
                    </DialogTitle>
                    <DialogDescription className="text-center text-lg">
                        Choose the best plan for your needs
                    </DialogDescription>
                </DialogHeader>

                {isFetchingSubscription ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                        {plans.map((plan) => {
                            const isCurrentPlan = currentPriceId === plan.priceId;

                            return (
                                <div
                                    key={plan.id}
                                    className={cn(
                                        "relative flex flex-col p-6 border rounded-xl bg-card hover:shadow-md transition-shadow",
                                        plan.popular && "border-primary shadow-sm",
                                        isCurrentPlan && "border-green-500 bg-green-50/10"
                                    )}
                                >
                                    {plan.popular && !isCurrentPlan && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                                            Most Popular
                                        </div>
                                    )}

                                    {isCurrentPlan && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                                            Current Plan
                                        </div>
                                    )}

                                    <div className="mb-4">
                                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                                        <div className="flex items-baseline mt-2">
                                            <span className="text-3xl font-bold">{plan.price}</span>
                                            <span className="text-muted-foreground ml-1">
                                                {plan.period}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {plan.billing}
                                        </p>
                                    </div>

                                    <ul className="space-y-3 mb-6 flex-1">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-2 text-sm">
                                                <Check className="w-4 h-4 text-green-500 mt-0.5" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {isCurrentPlan ? (
                                        <Button
                                            onClick={handleCancel}
                                            variant="destructive"
                                            disabled={isLoading !== null}
                                            className="w-full"
                                        >
                                            {isLoading === "cancel" ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Canceling...
                                                </>
                                            ) : (
                                                "Cancel Subscription"
                                            )}
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => handleSubscribe(plan.priceId, plan.id)}
                                            disabled={isLoading !== null || currentPriceId !== null}
                                            className={cn(
                                                "w-full",
                                                plan.popular ? "bg-primary" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                            )}
                                        >
                                            {isLoading === plan.id ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Redirecting...
                                                </>
                                            ) : (
                                                "Subscribe"
                                            )}
                                        </Button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
