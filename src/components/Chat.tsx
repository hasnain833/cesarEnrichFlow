"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUp, Share, Sun, Moon, User } from "lucide-react";
import { Ripple } from "@/components/ui/ripple";
import logo from "../../public/logo.png";
import { cn } from "@/lib/utils";
import Image from "next/image";

const tabs = ["Apollo API", "LeadMagic", "IcyPeas", "TryKitt", "A-Leads", "MailVerify", "Enrichly"];
const suggestionCards = [

];

export const Chat = () => {
    const [activeTab, setActiveTab] = useState("Shadcn");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <section className="overflow-hidden">
            <div className="">
                {/* Tabs */}
                <div className="lg:flex hidden justify-between ">
                    <div className="flex gap-2  overflow-x-auto ">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg hover:bg-[#1d1d1d] mb-2 mt-2  ${activeTab === tab
                                    ? "text-foreground border-b-2 border-foreground bg-[#1d1d1d]"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}>
                                {tab}
                            </button>
                        ))}
                        {/* <a
                        href="#"
                        className="flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-[#1d1d1d]">
                        My Account
                        <span>→</span>
                    </a> */}
                    </div>

                    <div className="flex items-end gap-2 items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hidden md:flex items-center gap-2 w-100 rounded-full  text-muted-foreground bg-secondary/50 hover:bg-secondary border border-border px-3">
                            <User className="w-4 h-4 " />
                            <span className="text-sm">My Account</span>
                        </Button>
                        {mounted && (
                            <div className="hidden md:flex items-center p-1 rounded-full border border-border bg-secondary/30 me-4">
                                <button
                                    onClick={() => setTheme("light")}
                                    className={cn(
                                        "flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200",
                                        theme === "light"
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
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
                                            : "text-muted-foreground hover:text-foreground"
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
                            className={`hidden md:flex flex-col bg-secondary/30 items-center p-3 transition-all duration-300 ease-in-out overflow-hidden ${isSidebarOpen
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
                                className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg border border-border hover:bg-surface-hover transition-all duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0"
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
                                            className="flex flex-col items-start p-4 rounded-xl border border-border bg-secondary/30 hover:bg-surface-hover transition-colors text-left">
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
                                <div className="flex flex-col gap-10 px-3 py-3 rounded-xl border border-border bg-secondary/30">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            placeholder="Send a message..."
                                            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                                            <Plus className="w-5 h-5" />
                                        </button>
                                        <button className="text-muted-foreground hover:text-foreground transition-colors">
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
        </section>
    );
};
