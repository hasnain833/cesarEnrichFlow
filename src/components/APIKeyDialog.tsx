"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface APIKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiName: string;
  user: SupabaseUser | null;
  onSave: () => void;
}

export function APIKeyDialog({
  open,
  onOpenChange,
  apiName,
  user,
  onSave,
}: APIKeyDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isMasked, setIsMasked] = useState(false);
  const [originalKey, setOriginalKey] = useState("");
  const supabase = createClient();

  // Load existing API key when dialog opens
  useEffect(() => {
    if (open && user) {
      loadExistingKey();
    } else {
      setApiKey("");
    }
  }, [open, user]);

  const loadExistingKey = async () => {
    if (!user) return;

    setIsLoadingExisting(true);
    try {
      // Load from user metadata
      const apiKeys = user.user_metadata?.api_keys || {};
      const existingKey = apiKeys[apiName] || "";

      if (existingKey) {
        setOriginalKey(existingKey);
        // Mask the key for display (show only last 4 characters)
        if (existingKey.length > 4) {
          const masked =
            "•".repeat(existingKey.length - 4) + existingKey.slice(-4);
          setApiKey(masked);
          setIsMasked(true);
        } else {
          setApiKey(existingKey);
          setIsMasked(false);
        }
        setShowApiKey(false);
      } else {
        setApiKey("");
        setOriginalKey("");
        setIsMasked(false);
        setShowApiKey(false);
      }
    } catch (error) {
      console.error("Error loading API key:", error);
    } finally {
      setIsLoadingExisting(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please log in to save API keys");
      onOpenChange(false);
      return;
    }

    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }

    // If the key is masked, don't update it
    if (isMasked) {
      toast.info(
        "API key already saved. Clear the field and enter a new key to update."
      );
      return;
    }

    setIsLoading(true);
    try {
      // Get existing API keys from metadata
      const existingApiKeys = user.user_metadata?.api_keys || {};

      // Update API keys
      const updatedApiKeys = {
        ...existingApiKeys,
        [apiName]: apiKey.trim(),
      };

      // Save to user metadata
      const { error } = await supabase.auth.updateUser({
        data: { api_keys: updatedApiKeys },
      });

      if (error) throw error;

      toast.success(`${apiName} API key saved successfully`);
      onSave();
      onOpenChange(false);
      setApiKey("");
      setShowApiKey(false);
      setIsMasked(false);
      setOriginalKey("");
    } catch (error: any) {
      toast.error(error.message || "Failed to save API key");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // If current value is masked, clear it to allow new input
    if (isMasked) {
      setApiKey("");
      setIsMasked(false);
      setOriginalKey("");
    } else {
      setApiKey(e.target.value);
    }
  };

  const toggleVisibility = () => {
    if (isMasked && originalKey) {
      // Show the original key
      setApiKey(originalKey);
      setIsMasked(false);
      setShowApiKey(true);
    } else if (showApiKey && originalKey) {
      // Hide it back to masked
      const masked = "•".repeat(originalKey.length - 4) + originalKey.slice(-4);
      setApiKey(masked);
      setIsMasked(true);
      setShowApiKey(false);
    } else {
      // Toggle for new keys
      setShowApiKey(!showApiKey);
    }
  };

  const handleRemove = async () => {
    if (!user) {
      toast.error("Please log in to remove API keys");
      return;
    }

    setIsLoading(true);
    try {
      // Get existing API keys from metadata
      const existingApiKeys = user.user_metadata?.api_keys || {};

      // Remove the API key
      const updatedApiKeys = { ...existingApiKeys };
      delete updatedApiKeys[apiName];

      // Save to user metadata
      const { error } = await supabase.auth.updateUser({
        data: { api_keys: updatedApiKeys },
      });

      if (error) throw error;

      toast.success(`${apiName} API key removed successfully`);
      onSave();
      onOpenChange(false);
      setApiKey("");
      setShowApiKey(false);
      setIsMasked(false);
      setOriginalKey("");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove API key");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{apiName} API Key</DialogTitle>
          <DialogDescription>
            Enter your {apiName} API key. It will be securely stored.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                placeholder="Enter your API key"
                value={apiKey}
                onChange={handleInputChange}
                disabled={isLoading || isLoadingExisting}
                className="pr-10"
              />
              {apiKey && (
                <button
                  type="button"
                  onClick={toggleVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading || isLoadingExisting}>
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            {isLoadingExisting && (
              <p className="text-xs text-muted-foreground">
                Loading existing key...
              </p>
            )}
            {isMasked && (
              <p className="text-xs text-muted-foreground">
                API key is saved. Click the eye icon to view it, clear the field
                and enter a new key to update it, or click Remove to delete it.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {isMasked && (
              <Button
                onClick={handleRemove}
                variant="destructive"
                className="flex-1"
                disabled={isLoading || isLoadingExisting}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove"
                )}
              </Button>
            )}
            <Button
              onClick={handleSave}
              className={isMasked ? "flex-1" : "w-full"}
              disabled={
                isLoading || isLoadingExisting || !apiKey.trim() || isMasked
              }>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
  );
}
