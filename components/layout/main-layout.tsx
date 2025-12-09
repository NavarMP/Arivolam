"use client";

import { DockNavigation, DockItem } from "@/components/layout/dock-navigation";
import { Home, Compass, BookOpen, Calendar, User, LayoutGrid } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/layout/user-nav";

const dockItems: DockItem[] = [
    { title: "Dashboard", icon: Home, href: "/student" },
    { title: "Campus Map", icon: Compass, href: "/map" },
    { title: "Academics", icon: BookOpen, href: "/academics" },
    { title: "Calendar", icon: Calendar, href: "/calendar" },
    { title: "Applications", icon: LayoutGrid, href: "/apps" },
    { title: "Profile", icon: User, href: "/profile" },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen bg-background pb-24">
            {/* Background gradient/decoration could go here */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

            <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/40 bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/20 p-1">
                        {/* Logo placeholder if needed */}
                        <div className="h-full w-full rounded-full bg-primary" />
                    </div>
                    <span className="text-lg font-bold tracking-tight">Arivolam</span>
                </div>
                <div className="flex items-center gap-4">
                    {/* Search Placeholer */}
                    <div className="hidden text-sm text-muted-foreground md:block">Cmd+K to search...</div>
                    <ThemeToggle />
                    <UserNav />
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8">
                {children}
            </main>

            <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
                <DockNavigation items={dockItems} />
            </div>
        </div>
    );
}
