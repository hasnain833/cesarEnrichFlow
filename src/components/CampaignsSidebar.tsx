"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Campaign {
  id: string;
  name: string;
  url: string;
  status: string;
  createdAt: string;
}

interface CampaignsSidebarProps {
  user: SupabaseUser | null;
  selectedCampaignId: string | null;
  onSelectCampaign: (campaignId: string | null) => void;
  refreshTrigger?: number; // Add refresh trigger
  onCreateNewCampaign?: () => void; // Callback for creating new campaign
}

export function CampaignsSidebar({
  user,
  selectedCampaignId,
  onSelectCampaign,
  refreshTrigger,
  onCreateNewCampaign,
}: CampaignsSidebarProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      loadCampaigns();
    } else {
      setCampaigns([]);
      setIsLoading(false);
    }
  }, [user, refreshTrigger]);

  const loadCampaigns = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/campaigns");
      if (!response.ok) {
        throw new Error("Failed to fetch campaigns");
      }
      const { campaigns: fetchedCampaigns } = await response.json();
      setCampaigns(fetchedCampaigns || []);
    } catch (error) {
      console.error("Error loading campaigns:", error);
      toast.error("Failed to load campaigns.");
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* New Campaign Button */}
      <div className="p-3 border-b border-border">
        <button
          onClick={() => {
            onSelectCampaign(null);
            if (onCreateNewCampaign) {
              onCreateNewCampaign();
            }
          }}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-lg border border-border hover:bg-accent transition-all duration-200"
          )}
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Campaigns List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No campaigns yet
          </div>
        ) : (
          <div className="space-y-1">
            {campaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => onSelectCampaign(campaign.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200",
                  selectedCampaignId === campaign.id
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <div className="truncate">{campaign.name}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

