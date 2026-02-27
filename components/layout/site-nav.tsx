"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    Info,
    Mail,
    GraduationCap,
    LogIn,
    LayoutDashboard,
    Menu,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdaptiveLogo } from "@/components/shared/adaptive-logo";
import { createClient } from "@/utils/supabase/client";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { UserNav } from "@/components/layout/user-nav";
import { getAuthStatus } from "@/app/campus/actions";

const navLinks = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/about", icon: Info, label: "About" },
    { href: "/contact", icon: Mail, label: "Contact" },
    { href: "/campus", icon: GraduationCap, label: "Campus" },
];

export function SiteNav() {
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setIsAuthenticated(true);
                return;
            }

            const erpStatus = await getAuthStatus();
            setIsAuthenticated(erpStatus.isAuthenticated);
        };

        checkAuth();
    }, []);

    return (
        <header className="fixed left-0 right-0 top-0 z-50">
            <div className="mx-4 mt-4 md:mx-8">
                <nav className="flex items-center justify-between rounded-2xl border border-border/40 bg-background/70 px-4 py-2.5 shadow-lg shadow-black/5 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 shrink-0">
                        <AdaptiveLogo size={28} />
                        <span className="text-sm font-bold tracking-tight hidden sm:inline">
                            Arivolam
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden items-center gap-1 md:flex">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link key={link.href} href={link.href}>
                                    <button
                                        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all ${isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            }`}
                                    >
                                        <link.icon className="h-4 w-4" />
                                        {link.label}
                                    </button>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right section */}
                    <div className="flex items-center gap-2">
                        <ThemeToggle />

                        {/* Auth button (desktop) */}
                        <div className="hidden md:flex items-center">
                            {isAuthenticated === null ? (
                                <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                            ) : isAuthenticated ? (
                                <UserNav />
                            ) : (
                                <Link href="/auth/login">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2 rounded-xl"
                                    >
                                        <LogIn className="h-4 w-4" />
                                        Sign In
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Mobile menu */}
                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full md:hidden"
                                >
                                    <Menu className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-72 p-0">
                                <SheetHeader className="border-b border-border/40 px-5 py-4">
                                    <SheetTitle className="flex items-center gap-2.5 text-sm">
                                        <AdaptiveLogo size={24} />
                                        Arivolam
                                    </SheetTitle>
                                </SheetHeader>
                                <nav className="flex flex-col gap-1 p-4">
                                    {navLinks.map((link) => {
                                        const isActive = pathname === link.href;
                                        return (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <button
                                                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                        }`}
                                                >
                                                    <link.icon className="h-4 w-4" />
                                                    {link.label}
                                                </button>
                                            </Link>
                                        );
                                    })}

                                    <div className="my-3 border-t border-border/40" />

                                    {isAuthenticated === null ? (
                                        <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
                                    ) : isAuthenticated ? (
                                        <div className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-2">
                                            <span className="px-2 text-sm font-medium text-muted-foreground">Signed In</span>
                                            <UserNav />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <Link
                                                href="/auth/login"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <Button
                                                    variant="outline"
                                                    className="w-full gap-2 rounded-xl"
                                                >
                                                    <LogIn className="h-4 w-4" />
                                                    Sign In
                                                </Button>
                                            </Link>
                                            <Link
                                                href="/auth/signup"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <Button className="w-full gap-2 rounded-xl">
                                                    Get Started
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </nav>
            </div>
        </header>
    );
}
