"use client";

import { useState, useEffect, Suspense } from "react";
import { useTheme } from "next-themes";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, ArrowUp, Sun, Moon, Check, Menu, X, Loader2, Download } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Ripple } from "@/components/ui/ripple";
import { AccountDropdown } from "@/components/AccountDropdown";
import { APIKeyDialog } from "@/components/APIKeyDialog";
import { AuthDialog } from "@/components/AuthDialog";
import { CampaignsSidebar } from "@/components/CampaignsSidebar";
import { CampaignTable } from "@/components/CampaignTable";
import { PricingDialog } from "@/components/PricingDialog";
import { Button } from "@/components/ui/button";
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

// Mandatory API keys (must be set)
const mandatoryApiKeys = ["Apollo API"];

// One of these must be set
const leadSourceApiKeys = ["LeadMagic", "IcyPeas", "TryKitt", "A-Leads"];

// Optional API keys (user can have none, one, or both)
const optionalApiKeys = ["MailVerify", "Enrichly"];
const suggestionCards = [];

// Component to handle email verification errors (uses useSearchParams)
function EmailVerificationHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

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

  return null;
}

function ChatContent() {
  const [activeTab, setActiveTab] = useState("Shadcn");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState<string | null>(null);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [savedApiKeys, setSavedApiKeys] = useState<Set<string>>(new Set());
  const [hasAllApiKeys, setHasAllApiKeys] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null
  );
  const [campaignsRefreshTrigger, setCampaignsRefreshTrigger] = useState(0);
  const [campaignName, setCampaignName] = useState<string>("");
  const [campaignInfo, setCampaignInfo] = useState<{
    id: string;
    name: string;
    status: string;
    progress?: { total: number; processed: number };
  } | null>(null);
  const [campaignContacts, setCampaignContacts] = useState<any[]>([]);
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Open sidebar by default on desktop only
  useEffect(() => {
    const checkDesktop = () => {
      // md breakpoint in Tailwind is 768px
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      }
    };

    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

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
        setHasAllApiKeys(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    const loadCampaignInfo = async () => {
      if (!selectedCampaignId) {
        setCampaignName("");
        setCampaignInfo(null);
        setCampaignContacts([]);
        return;
      }

      try {
        const response = await fetch(`/api/campaigns/${selectedCampaignId}`);
        if (response.ok) {
          const { campaign } = await response.json();
          setCampaignName(campaign.name || "");
          const contacts = campaign.contacts || [];
          setCampaignContacts(contacts);
          const contactsCount = contacts.length || 0;
          const completedContacts = contacts.filter((c: any) =>
            c.status === 'completed' ||
            c.emailVerified ||
            (c.email && c.email !== 'N/A') ||
            (c.firstName || c.lastName) ||
            c.company
          ).length || 0;
          setCampaignInfo({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            progress: contactsCount > 0 ? {
              total: contactsCount,
              processed: completedContacts,
            } : undefined,
          });
        }
      } catch (error) {
        console.error("Error loading campaign info:", error);
        setCampaignName("");
        setCampaignInfo(null);
        setCampaignContacts([]);
      }
    };

    loadCampaignInfo();
  }, [selectedCampaignId, campaignsRefreshTrigger]);

  useEffect(() => {
    if (!selectedCampaignId || !campaignInfo) {
      return;
    }

    const status = campaignInfo.status;
    const progress = campaignInfo.progress;
    const shouldPoll = status === 'processing' ||
      (progress &&
        progress.total > 0 &&
        progress.processed < progress.total);

    if (!shouldPoll) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/campaigns/${selectedCampaignId}`);
        if (response.ok) {
          const { campaign } = await response.json();
          const contacts = campaign.contacts || [];
          setCampaignContacts(contacts);
          const contactsCount = contacts.length || 0;
          const completedContacts = contacts.filter((c: any) =>
            c.status === 'completed' ||
            c.emailVerified ||
            (c.email && c.email !== 'N/A') ||
            (c.firstName || c.lastName) ||
            c.company
          ).length || 0;

          setCampaignInfo({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            progress: contactsCount > 0 ? {
              total: contactsCount,
              processed: completedContacts,
            } : undefined,
          });
        }
      } catch (error) {
        console.error("Error polling campaign status:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedCampaignId, campaignInfo]);

  const handleExportCSV = () => {
    if (campaignContacts.length === 0) {
      toast.error('No data to export');
      return;
    }

    const columnMap: Record<string, { label: string; key: string }> = {
      name: { label: 'Name', key: 'name' },
      email: { label: 'Email', key: 'email' },
      title: { label: 'Title', key: 'title' },
      company: { label: 'Company', key: 'company' },
      companyDomain: { label: 'Company Domain', key: 'companyDomain' },
      phone: { label: 'Phone', key: 'phone' },
      linkedinUrl: { label: 'LinkedIn', key: 'linkedinUrl' },
      city: { label: 'City', key: 'city' },
      state: { label: 'State', key: 'state' },
      country: { label: 'Country', key: 'country' },
      status: { label: 'Status', key: 'status' },
      enrichedBy: { label: 'Source', key: 'enrichedBy' },
      emailVerified: { label: 'Email Verified', key: 'emailVerified' },
      emailVerificationStatus: { label: 'Verification Status', key: 'emailVerificationStatus' },
    };

    const availableColumns = Object.entries(columnMap).filter(([_, config]) => {
      return campaignContacts.some((contact: any) => {
        const value = contact[config.key];
        return value !== null && value !== undefined && value !== '';
      });
    });

    const alwaysInclude = ['name', 'email'];
    const included = new Set(availableColumns.map(([key]) => key));
    alwaysInclude.forEach(key => {
      if (!included.has(key) && columnMap[key]) {
        availableColumns.unshift([key, columnMap[key]]);
      }
    });

    const columns = availableColumns.map(([key, config]) => ({ key, ...config }));

    if (columns.length === 0) {
      toast.error('No data to export');
      return;
    }

    const getCSVValue = (contact: any, columnKey: string): string => {
      if (columnKey === 'name') {
        return [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'N/A';
      }

      if (columnKey === 'emailVerified') {
        return contact.emailVerified ? 'Yes' : 'No';
      }

      const value = contact[columnKey];
      if (value === null || value === undefined || value === '') {
        return 'N/A';
      }
      return String(value);
    };

    const headers = columns.map(col => col.label);

    const rows = campaignContacts.map((contact: any) =>
      columns.map(col => getCSVValue(contact, col.key))
    );

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${campaignInfo?.name || 'campaign'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('CSV exported successfully');
  };

  const loadSavedApiKeys = async (currentUser: SupabaseUser) => {
    try {
      const response = await fetch("/api/integrations");
      if (response.ok) {
        const data = await response.json();
        const saved = new Set<string>(
          data.integrations
            .filter((integration: any) => integration.isActive)
            .map((integration: any) => integration.serviceName)
        );
        setSavedApiKeys(saved);

        const hasMandatory = mandatoryApiKeys.every(key => saved.has(key));
        const hasClickSource = leadSourceApiKeys.some(key => saved.has(key));

        setHasAllApiKeys(hasMandatory && hasClickSource);
      } else {
        setSavedApiKeys(new Set());
        setHasAllApiKeys(false);
      }
    } catch (error) {
      console.error("Error loading API keys:", error);
      setSavedApiKeys(new Set());
      setHasAllApiKeys(false);
    }
  };

  const handleTabClick = (tab: string) => {
    if (!user) {
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

    if (!hasAllApiKeys) {
      console.log("Validation Debug:", {
        savedApiKeys: Array.from(savedApiKeys),
        mandatoryApiKeys,
        leadSourceApiKeys
      });

      const missingMandatory = mandatoryApiKeys.filter(key => !savedApiKeys.has(key));
      const hasLeadSource = leadSourceApiKeys.some(key => savedApiKeys.has(key));

      console.log("Validation Logic:", {
        missingMandatory,
        hasLeadSource,
        missingMandatoryLen: missingMandatory.length
      });


      let description = "";
      if (missingMandatory.length > 0) {
        description = `You need to add the mandatory API key: ${missingMandatory.join(", ")}.`;
      } else if (!hasLeadSource) {
        description = `You need to add at least one lead source API key from: ${leadSourceApiKeys.join(", ")}.`;
      }

      toast.info("Add all required API keys to use the chat", {
        description: description + " Click on the tabs above to add your API keys.",
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
      setHasAllApiKeys(false);
      setSavedApiKeys(new Set());
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setInputError("");
      return false;
    }

    if (!url.trim().startsWith("https://app.apollo.io/")) {
      setInputError("URL must start with https://app.apollo.io/");
      return false;
    }

    try {
      const urlObj = new URL(url);

      if (urlObj.protocol !== "https:") {
        setInputError("URL must use HTTPS protocol");
        return false;
      }

      if (urlObj.hostname.toLowerCase() !== "app.apollo.io") {
        setInputError("URL must start with https://app.apollo.io/");
        return false;
      }

      setInputError("");
      return true;
    } catch (error) {
      setInputError(
        "Please enter a valid URL starting with https://app.apollo.io/"
      );
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.trim()) {
      validateUrl(value);
    } else {
      setInputError("");
    }
  };

  const handleSubmit = async () => {
    if (!user || !hasAllApiKeys) {
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
        if (response.status === 403) {
          setIsPricingDialogOpen(true);
          return;
        }
        const error = await response.json();
        throw new Error(error.error || "Failed to create campaign");
      }

      const { campaign } = await response.json();

      if (campaign.status === 'processing') {
        toast.success("Campaign created and enrichment started!", {
          description: "Your campaign is being processed. Check the progress below.",
        });
      } else if (campaign.warning) {
        toast.warning("Campaign created", {
          description: campaign.warning,
        });
      } else {
        toast.success("Campaign created successfully!");
      }

      setCampaignsRefreshTrigger((prev) => prev + 1);

      setSelectedCampaignId(campaign.id);

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
    <>
      <PricingDialog open={isPricingDialogOpen} onOpenChange={setIsPricingDialogOpen} />
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
                className={`hidden md:flex flex-col bg-muted/30 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen
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
                {/* Chat Header - Sidebar Toggle and Campaign Info */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
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
                    {campaignInfo && (
                      <h2 className="text-lg font-semibold text-foreground">
                        {campaignInfo.name}
                      </h2>
                    )}
                  </div>
                  {campaignInfo && (
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
                          campaignInfo.status === "completed"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : campaignInfo.status === "processing"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : campaignInfo.status === "failed"
                                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                        )}>
                        {campaignInfo.status === "processing" && (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        )}
                        {campaignInfo.status.charAt(0).toUpperCase() + campaignInfo.status.slice(1)}
                      </span>

                      {campaignContacts.length > 0 && (
                        <Button
                          onClick={handleExportCSV}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Export
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Chat Content */}
                {selectedCampaignId ? (
                  <CampaignTable
                    campaignId={selectedCampaignId}
                    onRefresh={() => setCampaignsRefreshTrigger((prev) => prev + 1)}
                  />
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
                          readOnly={!user || !hasAllApiKeys}
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
                          disabled={!user || !hasAllApiKeys}>
                          <Plus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={
                            !user ||
                            !hasAllApiKeys ||
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
      </section >
    </>
  );
}

// Export Chat component wrapped in Suspense for useSearchParams
export const Chat = () => {
  return (
    <Suspense fallback={null}>
      <EmailVerificationHandler />
      <ChatContent />
    </Suspense>
  );
};
