"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, Bell, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarNavItems = [
    {
        title: "Profile",
        href: "/settings/profile",
        icon: <User className="h-4 w-4" />,
    },
    {
        title: "Account",
        href: "/settings/account",
        icon: <Shield className="h-4 w-4" />,
    },
    {
        title: "Appearance",
        href: "/settings/appearance",
        icon: <Palette className="h-4 w-4" />,
    },
    {
        title: "Notifications",
        href: "/settings/notifications",
        icon: <Bell className="h-4 w-4" />,
    },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
            <div className="flex flex-col space-y-8 md:flex-row md:space-x-12 md:space-y-0">
                <aside className="md:w-1/4">
                    <div className="sticky top-24">
                        <h2 className="mb-6 font-semibold tracking-tight text-xl">Settings</h2>
                        <nav className="flex flex-col space-y-1">
                            {sidebarNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-muted",
                                        pathname === item.href
                                            ? "bg-primary/10 text-primary shadow-sm hover:bg-primary/15"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {item.icon}
                                    {item.title}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </aside>
                <div className="flex-1 max-w-3xl">
                    <div className="rounded-xl border border-border/40 bg-card p-6 shadow-sm sm:p-8">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
