"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthDialog } from "@/components/AuthDialog";
import { ProfileDialog } from "@/components/ProfileDialog";
import { PricingDialog } from "@/components/PricingDialog";
import { createClient } from "@/lib/supabase/client";
import { User, LogOut } from "lucide-react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function AccountDropdown() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logged out successfully");
      setUser(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to logout");
    }
  };

  const handleAuthSuccess = () => {
    // Refresh user data
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  };

  const handleProfileUpdate = () => {
    // Refresh user data after profile update
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  };

  if (loading) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 w-100 rounded-full text-muted-foreground bg-muted/50 hover:bg-accent border border-border px-3"
        disabled>
        <User className="w-4 h-4" />
        <span className="text-sm hidden sm:inline">Loading...</span>
      </Button>
    );
  }

  if (!user) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAuthDialogOpen(true)}
          className="flex items-center gap-2 w-100 rounded-full text-muted-foreground bg-muted/50 hover:bg-accent border border-border px-3">
          <User className="w-4 h-4" />
          <span className="text-sm hidden sm:inline">Login / Signup</span>
        </Button>
        <AuthDialog
          open={isAuthDialogOpen}
          onOpenChange={setIsAuthDialogOpen}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 w-100 rounded-full text-muted-foreground bg-muted/50 hover:bg-accent border border-border px-3">
            <User className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">
              {user.user_metadata?.first_name ||
                user.email?.split("@")[0] ||
                "My Account"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">
                {user.user_metadata?.first_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsPricingDialogOpen(true)}>
              Subscription
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {user && (
        <>
          <ProfileDialog
            open={isProfileDialogOpen}
            onOpenChange={setIsProfileDialogOpen}
            user={user}
            onUpdate={handleProfileUpdate}
          />
          <PricingDialog
            open={isPricingDialogOpen}
            onOpenChange={setIsPricingDialogOpen}
          />
        </>
      )}
    </>
  );
}
