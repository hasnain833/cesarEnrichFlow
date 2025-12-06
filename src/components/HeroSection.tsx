"use client";

import { Star, Copy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export const HeroSection = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("npx EnrichFlow init");
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="pt-32 pb-8 px-4">
      <div className="container mx-auto max-w-8xl">
        {/* GitHub Stars Badge */}
        <div className="github-star-button inline-flex items-center gap-2 px-4 py-2 rounded-full transition-colors mb-8 group">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <span className="text-primary font-medium text-sm">7.6k</span>
          <span className="text-foreground text-sm">Star us on GitHub</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-[28px] font-semibold text-foreground mb-2 leading-tight">
          UX of ChatGPT in your own app
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl">
          Open-source React toolkit for production AI chat experiences.
        </p>

        {/* CLI Command */}
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-secondary border border-border mb-4">
          <span className="text-muted-foreground font-mono text-sm">$</span>
          <code className="text-foreground font-mono text-sm">
            npx EnrichFlow init
          </code>
          <button
            onClick={handleCopy}
            className="text-muted-foreground hover:text-foreground transition-colors ml-2">
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center mb-4">
          <Button className="bg-transparent text-muted-foreground hover:bg-surface-hover">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground">
            Contact Sales
          </Button>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>Backed by</span>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                Y
              </div>
              <span className="text-foreground">Combinator</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
