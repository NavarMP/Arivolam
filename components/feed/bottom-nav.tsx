"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Plus, MapPin, User, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface BottomNavProps {
    user: SupabaseUser | null;
}

const navItems = [
    { href: "/", icon: Home, label: "Feed" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/create", icon: Plus, label: "Create", isAction: true },
    { href: "/campus-map", icon: MapPin, label: "Campus" },
];

export function BottomNav({ user }: BottomNavProps) {
    const pathname = usePathname();

    const profileItem = user
        ? { href: `/profile/${user.id}`, icon: User, label: "Profile" }
        : { href: "/auth/login", icon: LogIn, label: "Sign In" };

    const allItems = [...navItems, profileItem];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/80 backdrop-blur-xl md:hidden">
            <nav className="flex items-center justify-around px-2 py-2">
                {allItems.map((item) => {
                    const isActive = pathname === item.href;
                    const isAction = "isAction" in item && item.isAction;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center gap-0.5 relative"
                        >
                            {isAction ? (
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                >
                                    <item.icon className="h-5 w-5" />
                                </motion.div>
                            ) : (
                                <>
                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isActive
                                                ? "text-primary"
                                                : "text-muted-foreground"
                                            }`}
                                    >
                                        <item.icon className="h-5 w-5" />
                                    </motion.div>
                                    <span
                                        className={`text-[10px] font-medium ${isActive
                                                ? "text-primary"
                                                : "text-muted-foreground"
                                            }`}
                                    >
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="bottomNavIndicator"
                                            className="absolute -top-2 h-0.5 w-6 rounded-full bg-primary"
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
