"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Loader2, Edit, X, Eye, EyeOff } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Password change schema
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Profile update schema
const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
});

type PasswordFormData = z.infer<typeof passwordSchema>;
type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SupabaseUser;
  onUpdate: () => void;
}

export function ProfileDialog({
  open,
  onOpenChange,
  user,
  onUpdate,
}: ProfileDialogProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showViewPassword, setShowViewPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const supabase = createClient();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.user_metadata?.first_name || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Reset forms when dialog opens/closes
  useEffect(() => {
    if (open) {
      profileForm.reset({
        firstName: user.user_metadata?.first_name || "",
      });
      setIsEditMode(false);
      setIsChangingPassword(false);
      setShowViewPassword(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open, user, profileForm]);

  const handleSaveProfile = async (data: ProfileFormData) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { first_name: data.firstName },
      });

      if (error) throw error;

      toast.success("Profile updated successfully");
      setIsEditMode(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async (data: PasswordFormData) => {
    try {
      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: data.currentPassword,
      });

      if (signInError) {
        toast.error("Current password is incorrect");
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) throw updateError;

      toast.success("Password changed successfully");
      passwordForm.reset();
      setIsChangingPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) {
      toast.error("Email address not found");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      toast.success("Password reset email sent! Check your inbox.");
      setIsChangingPassword(false);
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to send password reset email");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-w-[calc(100vw-2rem)] sm:mx-0 mx-4">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Edit your profile information"
              : "View your profile information"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!isEditMode ? (
            // View Mode
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <div className="px-3 py-2 rounded-md border border-border bg-secondary/30 text-sm">
                    {user.user_metadata?.first_name || "Not set"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="px-3 py-2 rounded-md border border-border bg-secondary/30 text-sm">
                    {user.email}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <div className="px-3 py-2 rounded-md border border-border bg-secondary/30 text-sm flex items-center justify-between">
                      <span>••••••••••••</span>
                      <button
                        type="button"
                        onClick={() => setShowViewPassword(!showViewPassword)}
                        className="text-muted-foreground hover:text-foreground transition-colors ml-2"
                        title="Password is encrypted and cannot be displayed">
                        {showViewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {showViewPassword && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Password is encrypted for security and cannot be displayed. Use "Change" to update it.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setIsEditMode(true)}
                className="w-full"
                variant="default">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </>
          ) : (
            // Edit Mode
            <form
              onSubmit={profileForm.handleSubmit(handleSaveProfile)}
              className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  {...profileForm.register("firstName")}
                />
                {profileForm.formState.errors.firstName && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="bg-secondary/30"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              {!isChangingPassword ? (
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="password"
                      value="••••••••••••"
                      disabled
                      className="bg-secondary/30"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsChangingPassword(true)}>
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-4 border border-border rounded-md bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <Label>Change Password</Label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPassword(false);
                        passwordForm.reset();
                      }}
                      className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Controller
                        name="currentPassword"
                        control={passwordForm.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="Enter current password"
                            className="pr-10"
                            autoComplete="current-password"
                          />
                        )}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowCurrentPassword(!showCurrentPassword);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        Can't remember? Forgot Password
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Controller
                        name="newPassword"
                        control={passwordForm.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            className="pr-10"
                            autoComplete="new-password"
                          />
                        )}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowNewPassword(!showNewPassword);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Controller
                        name="confirmPassword"
                        control={passwordForm.control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            className="pr-10"
                            autoComplete="new-password"
                          />
                        )}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowConfirmPassword(!showConfirmPassword);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={passwordForm.handleSubmit(handleChangePassword)}
                    className="w-full"
                    variant="default">
                    Update Password
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditMode(false);
                    setIsChangingPassword(false);
                    profileForm.reset();
                    passwordForm.reset();
                  }}
                  className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
