"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, Edit2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  const loadCampaigns = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/campaigns");
      
      if (!response.ok) {
        // Handle different error statuses
        if (response.status === 401) {
          // User not authenticated - clear campaigns
          setCampaigns([]);
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch campaigns");
      }
      
      const { campaigns: fetchedCampaigns } = await response.json();
      setCampaigns(fetchedCampaigns || []);
    } catch (error: any) {
      console.error("Error loading campaigns:", error);
      // Only show toast for unexpected errors, not for empty results
      if (error.message && !error.message.includes("Failed to fetch")) {
        toast.error(error.message || "Failed to load campaigns.");
      }
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadCampaigns();
    } else {
      setCampaigns([]);
      setIsLoading(false);
    }
  }, [user, refreshTrigger, loadCampaigns]);

  const handleEdit = (campaign: Campaign, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCampaign(campaign);
    setEditName(campaign.name);
  };

  const handleSaveEdit = async () => {
    if (!editingCampaign || !editName.trim()) {
      toast.error("Campaign name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/campaigns/${editingCampaign.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update campaign");
      }

      toast.success("Campaign updated successfully");
      setEditingCampaign(null);
      setEditName("");
      loadCampaigns();
    } catch (error: any) {
      toast.error(error.message || "Failed to update campaign");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (campaign: Campaign, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingCampaign(campaign);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCampaign) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/campaigns/${deletingCampaign.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete campaign");
      }

      toast.success("Campaign deleted successfully");
      
      // If deleted campaign was selected, clear selection
      if (selectedCampaignId === deletingCampaign.id) {
        onSelectCampaign(null);
      }
      
      setDeletingCampaign(null);
      loadCampaigns();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete campaign");
    } finally {
      setIsDeleting(false);
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
              <div
                key={campaign.id}
                className={cn(
                  "group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                  selectedCampaignId === campaign.id
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <button
                  onClick={() => onSelectCampaign(campaign.id)}
                  className="flex-1 text-left truncate"
                >
                  {campaign.name}
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleEdit(campaign, e)}
                    className="p-1 hover:bg-accent rounded"
                    title="Edit campaign name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(campaign, e)}
                    className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                    title="Delete campaign"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Campaign Dialog */}
      <Dialog open={!!editingCampaign} onOpenChange={(open) => !open && setEditingCampaign(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Campaign Name</DialogTitle>
            <DialogDescription>
              Update the name of your campaign.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter campaign name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveEdit();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingCampaign(null);
                  setEditName("");
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={isSaving || !editName.trim()}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingCampaign} onOpenChange={(open) => !open && setDeletingCampaign(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>"{deletingCampaign?.name}"</strong>? This action cannot be undone and will permanently delete all associated contacts.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingCampaign(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Campaign"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

