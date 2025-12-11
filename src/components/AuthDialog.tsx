"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Loader2 } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Signup form schema
const signupSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess: () => void;
}

export function AuthDialog({
  open,
  onOpenChange,
  onAuthSuccess,
}: AuthDialogProps) {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      // Update user metadata with first name if available
      if (authData.user) {
        toast.success("Login successful!");
        onAuthSuccess();
        onOpenChange(false);
        loginForm.reset();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  const onSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectUrl = `${baseUrl}/auth/callback`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
          },
          // Use emailRedirectTo to set where ConfirmationURL redirects
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      if (authData.user) {
        toast.success(
          "Account created successfully! Please check your email to verify your account."
        );
        onAuthSuccess();
        onOpenChange(false);
        signupForm.reset();
        setMode("login");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPassword = async () => {
    const email = loginForm.getValues("email");
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectUrl = `${baseUrl}/auth/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast.success("Password reset email sent! Check your inbox.");
      setMode("login");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-w-[calc(100vw-2rem)] sm:mx-0 mx-4">
        <DialogHeader>
          <DialogTitle>
            {mode === "login" && "Login to your account"}
            {mode === "signup" && "Create an account"}
            {mode === "forgot" && "Reset your password"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login" &&
              "Enter your credentials to access your account"}
            {mode === "signup" &&
              "Fill in your information to create a new account"}
            {mode === "forgot" &&
              "Enter your email to receive a password reset link"}
          </DialogDescription>
        </DialogHeader>

        {mode === "login" && (
          <form
            onSubmit={loginForm.handleSubmit(onLogin)}
            className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                {...loginForm.register("email")}
              />
              {loginForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                {...loginForm.register("password")}
              />
              {loginForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Don't have an account?{" "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  loginForm.reset();
                }}
                className="text-foreground hover:underline">
                Sign up
              </button>
            </div>
          </form>
        )}

        {mode === "signup" && (
          <form
            onSubmit={signupForm.handleSubmit(onSignup)}
            className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-firstName">First Name</Label>
              <Input
                id="signup-firstName"
                type="text"
                placeholder="John"
                {...signupForm.register("firstName")}
              />
              {signupForm.formState.errors.firstName && (
                <p className="text-sm text-destructive">
                  {signupForm.formState.errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                {...signupForm.register("email")}
              />
              {signupForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {signupForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="••••••••"
                {...signupForm.register("password")}
              />
              {signupForm.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {signupForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-confirmPassword">Confirm Password</Label>
              <Input
                id="signup-confirmPassword"
                type="password"
                placeholder="••••••••"
                {...signupForm.register("confirmPassword")}
              />
              {signupForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {signupForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign up"
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Already have an account?{" "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  signupForm.reset();
                }}
                className="text-foreground hover:underline">
                Login
              </button>
            </div>
          </form>
        )}

        {mode === "forgot" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onForgotPassword();
            }}
            className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                {...loginForm.register("email")}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-foreground hover:underline">
                Back to login
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
