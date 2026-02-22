"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Home,
    Compass,
    Building2,
    Moon,
    Sun,
    LogOut,
    User,
    ChevronDown,
    Shield,
    Settings,
    Info,
    Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdaptiveLogo } from "@/components/shared/adaptive-logo";
import { signOut } from "@/app/auth/actions";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { NotificationDropdown } from "@/components/shared/notification-dropdown";
import { SearchCommand } from "@/components/shared/search-command";

interface DesktopNavProps {
    user: SupabaseUser | null;
}

const navLinks = [
    { href: "/", icon: Home, label: "Feed" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/about", icon: Info, label: "About" },
    { href: "/contact", icon: Mail, label: "Contact" },
];

export function DesktopNav({ user }: DesktopNavProps) {
    const pathname = usePathname();
    const { isNavVisible } = useScrollDirection();

    return (
        <header className={cn(
            "fixed left-0 right-0 top-0 z-50 hidden md:block transition-transform duration-300",
            !isNavVisible && "-translate-y-full"
        )}>
            {/* Glassmorphism nav bar */}
            <div className="mx-auto max-w-6xl px-6 pt-4">
                <nav className="flex items-center justify-between rounded-2xl border border-border/20 bg-background/60 px-6 py-3 shadow-lg shadow-black/[0.03] backdrop-blur-2xl dark:border-border/10 dark:bg-background/40 dark:shadow-black/10">
                    {/* Left: Logo + Brand */}
                    <Link href="/" className="group flex items-center gap-2.5">
                        <motion.div
                            whileHover={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 0.4 }}
                        >
                            <AdaptiveLogo size={34} />
                        </motion.div>
                        <span className="text-lg font-bold tracking-tight">
                            Arivolam
                        </span>
                    </Link>

                    {/* Center: Navigation links */}
                    <div className="flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link key={link.href} href={link.href}>
                                    <motion.div
                                        className={cn(
                                            "relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                                            isActive
                                                ? "text-primary"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                        whileHover={{ y: -1 }}
                                        whileTap={{ scale: 0.97 }}
                                    >
                                        <link.icon className="h-4 w-4" />
                                        <span>{link.label}</span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="desktopNavIndicator"
                                                className="absolute inset-0 rounded-xl bg-primary/8 dark:bg-primary/12"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 400,
                                                    damping: 30,
                                                }}
                                            />
                                        )}
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right: Search + Actions */}
                    <div className="flex items-center gap-2">
                        {/* Search (Command Palette) */}
                        <SearchCommand />

                        {user ? (
                            <>
                                {/* Campus ERP */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary"
                                    asChild
                                >
                                    <Link href="/campus">
                                        <Building2 className="h-4 w-4" />
                                    </Link>
                                </Button>

                                {/* Notifications */}
                                <NotificationDropdown />

                                <ThemeToggle />

                                {/* User avatar dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="relative h-9 w-9 rounded-xl p-0"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-xs font-bold ring-2 ring-primary/10">
                                                {user.user_metadata?.full_name?.charAt(0).toUpperCase() ||
                                                    user.email?.charAt(0).toUpperCase() ||
                                                    "U"}
                                            </div>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-56 rounded-xl border-border/40 bg-background/95 p-1 shadow-xl backdrop-blur-xl"
                                    >
                                        <DropdownMenuLabel className="rounded-lg px-3 py-2">
                                            <p className="text-sm font-semibold truncate">
                                                {user.user_metadata?.full_name || "User"}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {user.email}
                                            </p>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-border/40" />
                                        <DropdownMenuItem asChild className="rounded-lg">
                                            <Link
                                                href={`/profile/${user.id}`}
                                                className="flex items-center gap-2"
                                            >
                                                <User className="h-4 w-4" />
                                                Profile
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-lg">
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-border/40" />
                                        <DropdownMenuItem
                                            onClick={() => signOut()}
                                            className="rounded-lg text-destructive focus:text-destructive"
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Sign Out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <>
                                <ThemeToggle />
                                <Link href="/auth/login">
                                    <Button
                                        size="sm"
                                        className="rounded-xl px-5 text-xs font-semibold shadow-sm shadow-primary/20"
                                    >
                                        Sign In
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
}
