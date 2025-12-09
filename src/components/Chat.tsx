"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Plus, ArrowUp, Share, Sun, Moon, Check } from "lucide-react";
import { Ripple } from "@/components/ui/ripple";
import { AccountDropdown } from "@/components/AccountDropdown";
import { APIKeyDialog } from "@/components/APIKeyDialog";
import { AuthDialog } from "@/components/AuthDialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import logo from "../../public/logo.png";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const tabs = ["Apollo API", "LeadMagic", "IcyPeas", "TryKitt", "A-Leads", "MailVerify", "Enrichly"];
const suggestionCards = [

];

export const Chat = () => {
    const [activeTab, setActiveTab] = useState("Shadcn");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedApi, setSelectedApi] = useState<string | null>(null);
    const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
    const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [savedApiKeys, setSavedApiKeys] = useState<Set<string>>(new Set());
    const [hasAtLeastOneApiKey, setHasAtLeastOneApiKey] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [inputError, setInputError] = useState("");

    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const supabase = createClient();

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Get user and load saved API keys
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadSavedApiKeys(session.user);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadSavedApiKeys(session.user);
            } else {
                setSavedApiKeys(new Set());
                setHasAtLeastOneApiKey(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const loadSavedApiKeys = (currentUser: SupabaseUser) => {
        const apiKeys = currentUser.user_metadata?.api_keys || {};
        const saved = new Set<string>();
        
        tabs.forEach((tab) => {
            if (apiKeys[tab] && apiKeys[tab].trim()) {
                saved.add(tab);
            }
        });
        
        setSavedApiKeys(saved);
        setHasAtLeastOneApiKey(saved.size > 0);
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

    const handleAuthSuccess = () => {
        // Reload user data after successful login
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadSavedApiKeys(session.user);
            }
        });
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
                description: "You need to add at least one API key to send messages. Click on any tab above to add your API key.",
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

    const handleApiSave = () => {
        // Reload user data to get updated API keys
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                loadSavedApiKeys(session.user);
            } else {
                setHasAtLeastOneApiKey(false);
                setSavedApiKeys(new Set());
            }
        });
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
            setInputError("Please enter a valid URL starting with https://api.apollo.io/");
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

    const handleSubmit = () => {
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

        // URL is valid, process it
        toast.success("Valid Apollo URL!");
        // TODO: Add your URL processing logic here
        setInputValue("");
        setInputError("");
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
                {/* Tabs */}
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
                                    {hasApiKey && (
                                        <Check className="w-4 h-4 text-green-500" />
                                    )}
                            </button>
                            );
                        })}
                        {/* <a
                        href="#"
                        className="flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-[#1d1d1d]">
                        My Account
                        <span>→</span>
                    </a> */}
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
                <div className="rounded-xl border border-border bg-card overflow-hidden chat-gradient">
                    <div className="flex">
                        {/* Sidebar */}
                        <div
                            className={`hidden md:flex flex-col bg-muted/30 items-center p-3 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen
                                ? "w-60 opacity-100 translate-x-0"
                                : "w-0 opacity-0 -translate-x-full border-r-0 p-0"
                                }`}>
                            <div
                                className={`flex items-center gap-2 text-foreground text-sm mb-4 transition-opacity duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0"
                                    }`}>
                                <Image
                                    src={logo}
                                    alt="Logo"
                                    width={120}
                                    height={120}
                                    className="text-foreground"
                                />
                            </div>

                            <button
                                className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-lg border border-border hover:bg-accent transition-all duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0"
                                    }`}>
                                <Plus className="w-4 h-4" />
                                New Thread
                            </button>
                        </div>

                        {/* Main Chat Area */}
                        <div className="flex-1 flex flex-col min-h-[calc(100vh-6rem)]">
                            {/* Chat Header */}
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
                                    {/* <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Globe className="w-4 h-4" />
                                        <span>GPT 4o-mini</span>
                                        <span className="text-xs">:</span>
                                    </div> */}
                                </div>
                                <button className="text-muted-foreground hover:text-foreground">
                                    <Share className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Chat Content */}
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

                            {/* Input Area */}
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
                                            disabled={!user || !hasAtLeastOneApiKey || !inputValue.trim() || !!inputError}
                                            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            <ArrowUp className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
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
