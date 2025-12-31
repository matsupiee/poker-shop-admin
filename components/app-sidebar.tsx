"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Users,
    Trophy,
    CalendarDays,
    LayoutDashboard,
    Menu,
    LogOut,
    Settings,
    ClipboardList,
    Armchair,
    Coins
} from "lucide-react";
import { signOut } from "@/lib/better-auth/sign-out";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const menuItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/daily-visits", label: "Daily Visits", icon: CalendarDays },
    { href: "/players", label: "Players", icon: Users },
    { href: "/tournaments", label: "Tournaments", icon: Trophy },
    { href: "/ring-games/tables", label: "Ring Game Tables", icon: Armchair },
    { href: "/ring-games/dealer-shifts", label: "Ring Game Dealer Shifts", icon: ClipboardList },
    { href: "/ring-games/in-store-buy-in-options", label: "In-Store Buy-Ins", icon: Coins },
    { href: "/staff", label: "Staff", icon: Settings },
];

export function AppSidebar({ userEmail }: { userEmail: string }) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "sticky top-0 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 flex flex-col z-30 shrink-0",
                isCollapsed ? "w-16" : "w-64"
            )}
        >
            {/* Header / Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border/50 shrink-0">
                {!isCollapsed && (
                    <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent truncate">
                        Poker Admin
                    </span>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", isCollapsed ? "mx-auto" : "ml-auto")}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <Menu className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto no-scrollbar">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                                    : "hover:bg-sidebar-accent/50 text-muted-foreground hover:text-sidebar-foreground"
                            )}
                        >
                            {/* Active Indicator Line for coolness - only when not collapsed or maybe small dot when collapsed? */}
                            {isActive && !isCollapsed && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                            )}

                            <item.icon
                                className={cn(
                                    "h-5 w-5 shrink-0 transition-colors",
                                    isActive
                                        ? "text-primary"
                                        : "text-muted-foreground group-hover:text-sidebar-foreground"
                                )}
                            />

                            {!isCollapsed && (
                                <span className="truncate text-sm">{item.label}</span>
                            )}

                            {/* Tooltip for collapsed state could be here */}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User */}
            <div className="p-4 border-t border-sidebar-border/50 shrink-0">
                {!isCollapsed ? (
                    <div className="flex items-center gap-3 px-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center border border-sidebar-border">
                            <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-xs text-muted-foreground truncate" title={userEmail}>{userEmail}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center border border-sidebar-border">
                            <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>
                )}

                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                        isCollapsed && "justify-center px-0"
                    )}
                    onClick={() => signOut()}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    {!isCollapsed && "Logout"}
                </Button>
            </div>
        </aside>
    );
}
