"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Plus, Building2, User, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdaptiveLogo } from "@/components/shared/adaptive-logo";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface MobileNavProps {
    user: SupabaseUser | null;
}

const navItems = [
    { href: "/", icon: Home, label: "Feed" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/create", icon: Plus, label: "Create", isAction: true },
    { href: "/campus", icon: Building2, label: "Campus" },
];

export function MobileNav({ user }: MobileNavProps) {
    const pathname = usePathname();

    const profileItem = user
        ? { href: `/profile/${user.id}`, icon: User, label: "Profile" }
        : { href: "/auth/login", icon: LogIn, label: "Sign In" };

    const allItems = [...navItems, profileItem];

    return (
        <div className="fixed bottom-4 left-3 right-3 z-50 md:hidden">
            <motion.nav
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
                className="flex items-center justify-around rounded-[1.75rem] border border-border/20 bg-background/50 px-2 py-2 shadow-xl shadow-black/[0.08] backdrop-blur-3xl dark:border-white/[0.06] dark:bg-background/30 dark:shadow-black/20"
            >
                {allItems.map((item) => {
                    const isActive = pathname === item.href;
                    const isAction = "isAction" in item && item.isAction;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center gap-0.5"
                        >
                            {isAction ? (
                                <motion.div
                                    whileTap={{ scale: 0.85 }}
                                    whileHover={{ scale: 1.05 }}
                                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
                                >
                                    <item.icon className="h-5 w-5" strokeWidth={2.5} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    whileTap={{ scale: 0.85 }}
                                    className="relative flex flex-col items-center"
                                >
                                    <div
                                        className={cn(
                                            "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground"
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "h-5 w-5 transition-all",
                                                isActive && "scale-110"
                                            )}
                                            strokeWidth={isActive ? 2.5 : 1.8}
                                        />
                                    </div>
                                    <span
                                        className={cn(
                                            "text-[10px] font-medium transition-colors",
                                            isActive
                                                ? "text-primary"
                                                : "text-muted-foreground/70"
                                        )}
                                    >
                                        {item.label}
                                    </span>

                                    {/* Active indicator dot */}
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.div
                                                layoutId="mobileNavDot"
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0 }}
                                                className="absolute -top-1 h-1 w-1 rounded-full bg-primary"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 500,
                                                    damping: 30,
                                                }}
                                            />
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </Link>
                    );
                })}
            </motion.nav>
        </div>
    );
}
