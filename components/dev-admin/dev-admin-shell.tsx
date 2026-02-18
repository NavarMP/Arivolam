"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    LayoutDashboard,
    Building2,
    Users,
    ArrowLeft,
    Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

interface DevAdminShellProps {
    children: React.ReactNode;
    user: { email: string; name: string };
}

const NAV_ITEMS = [
    { label: "Overview", href: "/dev-admin", icon: LayoutDashboard },
    { label: "Institutions", href: "/dev-admin/institutions", icon: Building2 },
    { label: "Users", href: "/dev-admin/users", icon: Users },
];

export function DevAdminShell({ children, user }: DevAdminShellProps) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-background">
            {/* Top header */}
            <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Image
                        src="/assets/Logo.svg"
                        alt="Arivolam"
                        width={28}
                        height={28}
                        className="h-7 w-7"
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                            Dev Admin
                        </span>
                        <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                            <Shield className="h-3 w-3" />
                            SUPER
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="hidden text-xs text-muted-foreground md:block">
                        {user.name}
                    </span>
                    <ThemeToggle />
                </div>
            </header>

            <div className="flex">
                {/* Sidebar (desktop) */}
                <aside className="hidden w-56 shrink-0 border-r border-border/40 md:block">
                    <nav className="sticky top-[57px] space-y-1 p-3">
                        {NAV_ITEMS.map((item) => {
                            const isActive =
                                pathname === item.href ||
                                (item.href !== "/dev-admin" &&
                                    pathname.startsWith(item.href));
                            return (
                                <Link key={item.href} href={item.href}>
                                    <button
                                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            }`}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </button>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main content */}
                <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
            </div>

            {/* Bottom nav (mobile) */}
            <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border/40 bg-background/95 px-2 py-2 backdrop-blur md:hidden">
                {NAV_ITEMS.map((item) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dev-admin" &&
                            pathname.startsWith(item.href));
                    return (
                        <Link key={item.href} href={item.href}>
                            <button
                                className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors ${isActive
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                    }`}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </button>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
