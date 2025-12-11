"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, ArrowUp, Share, Sun, Moon, Check, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Ripple } from "@/components/ui/ripple";
import { AccountDropdown } from "@/components/AccountDropdown";
import { APIKeyDialog } from "@/components/APIKeyDialog";
import { AuthDialog } from "@/components/AuthDialog";
import { CampaignsSidebar } from "@/components/CampaignsSidebar";
import { CampaignTable } from "@/components/CampaignTable";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import logo from "../../public/logo.png";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const tabs = [
  "Apollo API",
  "LeadMagic",
  "IcyPeas",
  "TryKitt",
  "A-Leads",
  "MailVerify",
  "Enrichly",
];
const suggestionCards = [];

export const Chat = () => {
  const [activeTab, setActiveTab] = useState("Shadcn");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState<string | null>(null);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [savedApiKeys, setSavedApiKeys] = useState<Set<string>>(new Set());
  const [hasAtLeastOneApiKey, setHasAtLeastOneApiKey] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null
  );
  const [campaignsRefreshTrigger, setCampaignsRefreshTrigger] = useState(0);
  const [campaignName, setCampaignName] = useState<string>("");

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle email verification errors
  useEffect(() => {
    const error = searchParams.get('error');
    const reason = searchParams.get('reason');
    
    if (error === 'email_verification_failed') {
      let message = 'Email verification failed. ';
      
      if (reason === 'no_code') {
        message += 'No verification code provided.';
      } else if (reason?.includes('expired') || reason?.includes('already been used')) {
        message += 'This link has expired or has already been used. Please request a new verification email.';
      } else if (reason === 'no_user') {
        message += 'Unable to verify your account.';
      } else {
        message += 'Please try again or request a new verification email.';
      }
      
      toast.error(message);
      
      // Clean up URL by removing error parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('reason');
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, router]);

  // Open sidebar by default on desktop only
  useEffect(() => {
    const checkDesktop = () => {
      // md breakpoint in Tailwind is 768px
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      }
    };

    checkDesktop();
    // Optional: handle window resize if needed
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Get user and load saved API keys
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadSavedApiKeys(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadSavedApiKeys(session.user);
      } else {
        setSavedApiKeys(new Set());
        setHasAtLeastOneApiKey(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Load campaign name when campaign is selected
  useEffect(() => {
    const loadCampaignName = async () => {
      if (!selectedCampaignId) {
        setCampaignName("");
        return;
      }

      try {
        const response = await fetch(`/api/campaigns/${selectedCampaignId}`);
        if (response.ok) {
          const { campaign } = await response.json();
          setCampaignName(campaign.name || "");
        }
      } catch (error) {
        console.error("Error loading campaign name:", error);
        setCampaignName("");
      }
    };

    loadCampaignName();
  }, [selectedCampaignId]);

  const loadSavedApiKeys = async (currentUser: SupabaseUser) => {
    try {
      // Load API keys from Prisma backend
      const response = await fetch("/api/integrations");
      if (response.ok) {
        const data = await response.json();
        const saved = new Set<string>(
          data.integrations
            .filter((integration: any) => integration.isActive)
            .map((integration: any) => integration.serviceName)
        );
        setSavedApiKeys(saved);
        setHasAtLeastOneApiKey(saved.size > 0);
      } else {
        setSavedApiKeys(new Set());
        setHasAtLeastOneApiKey(false);
      }
    } catch (error) {
      console.error("Error loading API keys:", error);
      setSavedApiKeys(new Set());
      setHasAtLeastOneApiKey(false);
    }
  };

  const handleTabClick = (tab: string) => {
    if (!user) {
      // Show login prompt
      toast.info("Please log in to configure API keys", {
        description: "You need to be logged in to add or manage API keys.",
        action: {
          label: "Login",
          onClick: () => setIsAuthDialogOpen(true),
        },
      });
      return;
    }
    setSelectedApi(tab);
    setIsApiDialogOpen(true);
  };

  const handleAuthSuccess = async () => {
    // Reload user data after successful login
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (session?.user) {
      await loadSavedApiKeys(session.user);
    }
  };

  const handleInputClick = () => {
    if (!user) {
      // User not logged in
      toast.info("Please log in to use the chat", {
        description: "You need to be logged in to send messages.",
        action: {
          label: "Login",
          onClick: () => setIsAuthDialogOpen(true),
        },
      });
      setIsAuthDialogOpen(true);
      return;
    }

    if (!hasAtLeastOneApiKey) {
      // User logged in but no API keys
      toast.info("Add an API key to use the chat", {
        description:
          "You need to add at least one API key to send messages. Click on any tab above to add your API key.",
        action: {
          label: "Add API Key",
          onClick: () => {
            if (tabs.length > 0) {
              handleTabClick(tabs[0]);
            }
          },
        },
      });
      return;
    }
  };

  const handleApiSave = async () => {
    // Reload API keys from Prisma backend
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      await loadSavedApiKeys(session.user);
    } else {
      setHasAtLeastOneApiKey(false);
      setSavedApiKeys(new Set());
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setInputError("");
      return false;
    }

    // Check if URL starts with https://api.apollo.io/
    if (!url.trim().startsWith("https://api.apollo.io/")) {
      setInputError("URL must start with https://api.apollo.io/");
      return false;
    }

    try {
      const urlObj = new URL(url);

      // Check if it's HTTPS
      if (urlObj.protocol !== "https:") {
        setInputError("URL must use HTTPS protocol");
        return false;
      }

      // Verify the hostname is exactly api.apollo.io
      if (urlObj.hostname.toLowerCase() !== "api.apollo.io") {
        setInputError("URL must start with https://api.apollo.io/");
        return false;
      }

      setInputError("");
      return true;
    } catch (error) {
      setInputError(
        "Please enter a valid URL starting with https://api.apollo.io/"
      );
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Validate as user types
    if (value.trim()) {
      validateUrl(value);
    } else {
      setInputError("");
    }
  };

  const handleSubmit = async () => {
    if (!user || !hasAtLeastOneApiKey) {
      handleInputClick();
      return;
    }

    if (!inputValue.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    if (!validateUrl(inputValue)) {
      toast.error(inputError || "Invalid URL");
      return;
    }

    // Create campaign with the URL
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: inputValue.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create campaign");
      }

      const { campaign } = await response.json();
      toast.success("Campaign created successfully!");

      // Refresh campaigns list
      setCampaignsRefreshTrigger((prev) => prev + 1);

      // Automatically select the newly created campaign
      setSelectedCampaignId(campaign.id);

      // Clear input
      setInputValue("");
      setInputError("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create campaign");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section className="overflow-hidden">
      <div className="">
        {/* Mobile Header */}
        <div className="lg:hidden flex justify-between items-center px-4 py-3 border-b border-border">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex gap-2 items-center">
            <AccountDropdown />
            {mounted && (
              <div className="flex items-center p-1 rounded-full border border-border bg-muted/50">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200",
                    theme === "light"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  aria-label="Light theme">
                  <Sun className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200",
                    theme === "dark"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  aria-label="Dark theme">
                  <Moon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Overlay - Opens from top */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden fixed inset-0 bg-black/50 z-50"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              {/* Mobile Menu - Slides down from top */}
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="lg:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-50 shadow-xl overflow-y-auto max-h-[80vh]">
              {/* Header with Logo and Close */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-border">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close menu">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* API Integrations Section */}
              <div className="px-4 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  API Integrations
                </h3>
                <div className="space-y-2">
                  {tabs.map((tab) => {
                    const hasApiKey = savedApiKeys.has(tab);
                    return (
                      <button
                        key={tab}
                        onClick={() => {
                          handleTabClick(tab);
                          setIsMobileMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all duration-200",
                          activeTab === tab
                            ? "bg-accent text-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}>
                        <span>{tab}</span>
                        {hasApiKey && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Tabs */}
        <div className="lg:flex hidden justify-between ">
          <div className="flex gap-2  overflow-x-auto ">
            {tabs.map((tab) => {
              const hasApiKey = savedApiKeys.has(tab);
              return (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg hover:bg-accent mb-2 mt-2 flex items-center gap-2",
                    activeTab === tab
                      ? "text-foreground border-b-2 border-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground"
                  )}>
                  <span>{tab}</span>
                  {hasApiKey && <Check className="w-4 h-4 text-green-500" />}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 items-center">
            <AccountDropdown />
            {mounted && (
              <div className="hidden md:flex items-center p-1 rounded-full border border-border bg-muted/50 me-4">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200",
                    theme === "light"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  aria-label="Light theme">
                  <Sun className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200",
                    theme === "dark"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  aria-label="Dark theme">
                  <Moon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:rounded-xl border border-border bg-card overflow-hidden chat-gradient">
          <div className="flex">
            {/* Desktop Sidebar */}
            <div
              className={`hidden md:flex flex-col bg-muted/30 transition-all duration-300 ease-in-out overflow-hidden ${
                isSidebarOpen
                  ? "w-60 opacity-100 translate-x-0"
                  : "w-0 opacity-0 -translate-x-full border-r-0 p-0"
              }`}>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-center gap-2 text-foreground text-sm mb-4 p-3 border-b border-border">
                  <Image
                    src={logo}
                    alt="Logo"
                    width={120}
                    height={120}
                    className="text-foreground"
                  />
                </div>
                <CampaignsSidebar
                  user={user}
                  selectedCampaignId={selectedCampaignId}
                  onSelectCampaign={(id) => {
                    setSelectedCampaignId(id);
                  }}
                  refreshTrigger={campaignsRefreshTrigger}
                  onCreateNewCampaign={() => {
                    setInputValue("");
                    setInputError("");
                    setSelectedCampaignId(null);
                  }}
                />
              </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
              {isSidebarOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="md:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsSidebarOpen(false)}
                  />
                  {/* Sidebar */}
                  <motion.div
                    initial={{ x: -240 }}
                    animate={{ x: 0 }}
                    exit={{ x: -240 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="md:hidden fixed left-0 top-0 bottom-0 w-60 bg-[#1b1c1d] z-50 flex flex-col shadow-xl">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-3 border-b border-border">
                      <div className="flex items-center justify-center gap-2 text-foreground text-sm">
                        <Image
                          src={logo}
                          alt="Logo"
                          width={120}
                          height={120}
                          className="text-foreground"
                        />
                      </div>
                      <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Close sidebar">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <CampaignsSidebar
                      user={user}
                      selectedCampaignId={selectedCampaignId}
                      onSelectCampaign={(id) => {
                        setSelectedCampaignId(id);
                        // Close sidebar on mobile when campaign is selected
                        setIsSidebarOpen(false);
                      }}
                      refreshTrigger={campaignsRefreshTrigger}
                      onCreateNewCampaign={() => {
                        setInputValue("");
                        setInputError("");
                        setSelectedCampaignId(null);
                        // Close sidebar on mobile when creating new campaign
                        setIsSidebarOpen(false);
                      }}
                    />
                  </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-h-[calc(100vh-6rem)]">
              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* Sidebar Toggle Button */}
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      isSidebarOpen ? "Hide sidebar" : "Show sidebar"
                    }>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-panel-left size-4"
                      aria-hidden="true">
                      <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                      <path d="M9 3v18"></path>
                    </svg>
                  </button>
                  {selectedCampaignId && campaignName && (
                    <h2 className="text-lg font-semibold text-foreground">
                      {campaignName}
                    </h2>
                  )}
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                  <Share className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Content */}
              {selectedCampaignId ? (
                <CampaignTable campaignId={selectedCampaignId} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                  <Ripple />
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
                    Hello there!
                  </h2>
                  <p className="text-muted-foreground text-lg mb-12">
                    How can I help you today?
                  </p>

                  {/* Suggestion Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mb-8">
                    {suggestionCards.map((card, index) => (
                      <button
                        key={index}
                        className="flex flex-col items-start p-4 rounded-xl border border-border bg-muted/30 hover:bg-accent transition-colors text-left">
                        <span className="text-foreground font-medium text-sm">
                          {card.title}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {card.subtitle}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area - Only show when no campaign is selected */}
              {!selectedCampaignId && (
                <div className="p-4 w-full sm:w-2/3 mx-auto">
                  <div
                    className={cn(
                      "flex flex-col gap-10 px-3 py-3 rounded-xl border transition-colors",
                      inputError
                        ? "border-destructive bg-muted/30"
                        : "border-border bg-muted/30"
                    )}
                    onClick={handleInputClick}>
                    <div className="flex items-center gap-3">
                      <input
                        type="url"
                        placeholder="Send a message..."
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm cursor-text"
                        readOnly={!user || !hasAtLeastOneApiKey}
                      />
                    </div>
                    {inputError && (
                      <p className="text-xs text-destructive px-1">
                        {inputError}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        disabled={!user || !hasAtLeastOneApiKey}>
                        <Plus className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={
                          !user ||
                          !hasAtLeastOneApiKey ||
                          !inputValue.trim() ||
                          !!inputError
                        }
                        className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <ArrowUp className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/** Footer */}
      <div className="container mx-auto max-w-6xl">
        <p className="text-muted-foreground text-sm text-center p-[0.65rem]">
          © 2025 Existantly Inc.
        </p>
      </div>

      {/* API Key Dialog */}
      {selectedApi && (
        <APIKeyDialog
          open={isApiDialogOpen}
          onOpenChange={setIsApiDialogOpen}
          apiName={selectedApi}
          user={user}
          onSave={handleApiSave}
        />
      )}

      {/* Auth Dialog */}
      <AuthDialog
        open={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
        onAuthSuccess={handleAuthSuccess}
      />
    </section>
  );
};
