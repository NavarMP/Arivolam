"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    Home,
    Compass,
    BookOpen,
    Calendar,
    LayoutGrid,
    User,
    ArrowLeft,
    ShieldCheck,
    GraduationCap,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { DockNavigation, DockItem } from "@/components/layout/dock-navigation";
import { AIChatWidget } from "@/components/ai/chat-widget";

interface CampusLayoutProps {
    children: React.ReactNode;
    institution: {
        id: string;
        name: string;
        slug: string;
        short_name: string | null;
        logo_url: string | null;
    };
    userRole: string;
    slug: string;
    campusContext?: {
        institutionName?: string;
        buildings?: { name: string; category: string; description?: string }[];
        pois?: { name: string; category: string }[];
    };
}

export function CampusLayout({ children, institution, userRole, slug, campusContext }: CampusLayoutProps) {
    const pathname = usePathname();

    // Base dock items for everyone
    const dockItems: DockItem[] = [
        { title: "Dashboard", icon: Home, href: `/campus/${slug}` },
        { title: "Campus Map", icon: Compass, href: `/campus/${slug}/map` },
        { title: "Academics", icon: BookOpen, href: `/campus/${slug}/academics` },
        { title: "Calendar", icon: Calendar, href: `/campus/${slug}/calendar` },
        { title: "Apps", icon: LayoutGrid, href: `/campus/${slug}/apps` },
    ];

    // Role-based dock items
    if (userRole === "admin") {
        dockItems.push({ title: "Admin", icon: ShieldCheck, href: `/campus/${slug}/admin` });
    } else if (userRole === "staff") {
        dockItems.push({ title: "Teaching", icon: GraduationCap, href: `/campus/${slug}/teacher` });
    } else if (userRole === "parent") {
        dockItems.push({ title: "My Child", icon: Users, href: `/campus/${slug}/parent` });
    }

    // Profile always last
    dockItems.push({ title: "Profile", icon: User, href: `/campus/${slug}/profile` });

    return (
        <div className="relative min-h-screen bg-background pb-24">
            {/* Subtle background grid */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
                <div className="flex items-center gap-3">
                    <Link href="/campus">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>

                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
                            <img
                                src={institution.logo_url || "/assets/Logo.svg"}
                                alt={institution.short_name || institution.name}
                                className="h-7 w-7 object-contain"
                            />
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-sm font-semibold leading-tight">
                                {institution.short_name || institution.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                                {userRole}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="hidden text-xs text-muted-foreground md:block">
                        ⌘K to search
                    </span>
                    <ThemeToggle />
                </div>
            </header>

            {/* Main content */}
            <main className="container mx-auto p-4 md:p-8">
                {children}
            </main>

            {/* AI Chat Widget */}
            <AIChatWidget campusContext={campusContext} />

            {/* Dock navigation */}
            <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
                <DockNavigation items={dockItems} />
            </div>
        </div>
    );
}
