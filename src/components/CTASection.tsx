import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CTASection = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-8xl text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
          Build once. Ready for production.
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button className="bg-transparent border border-border text-foreground hover:bg-surface-hover">
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button className="bg-foreground text-background hover:bg-foreground/90">
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  );
};
