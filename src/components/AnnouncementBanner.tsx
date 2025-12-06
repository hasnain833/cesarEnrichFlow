"use client";

import { ArrowRight, X } from "lucide-react";
import { useState } from "react";

export const AnnouncementBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-gradient-to-r from-background via-secondary/50 to-background border-b border-border">
      <div className="container mx-auto px-4 py-2 flex items-center justify-center relative">
        <a
          href="#"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <span>We're hiring. Build the future of agentic UI.</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
