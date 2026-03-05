"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    Info,
    Mail,
    BookOpen,
    LogIn,
    UserPlus,
    Menu,
    Globe,
    GraduationCap,
    ChevronRight,
    User,
    LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdaptiveLogo } from "@/components/shared/adaptive-logo";
import { createClient } from "@/utils/supabase/client";
import { getAuthStatus, erpLogout } from "@/app/campus/actions";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DockNavigation, DockItem } from "@/components/layout/dock-navigation";

// Desktop navigation links
const navLinks = [
    { href: "/campus", icon: Home, label: "Home" },
    { href: "/about", icon: Info, label: "About" },
    { href: "/contact", icon: Mail, label: "Contact" },
    { href: "/campus/guide", icon: BookOpen, label: "Guide" },
];

// Mobile dock items (matching desktop nav)
const dockItems: DockItem[] = [
    { title: "Home", icon: Home, href: "/campus" },
    { title: "About", icon: Info, href: "/about" },
    { title: "Contact", icon: Mail, href: "/contact" },
    { title: "Guide", icon: BookOpen, href: "/campus/guide" },
];

interface AuthInfo {
    isAuthenticated: boolean;
    campusSlug: string | null;
    role: string | null;
    fullName: string | null;
}

export function CampusNav() {
    const pathname = usePathname();
    const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Check if user has a campus membership
                const { data: membership } = await supabase
                    .from("institution_members")
                    .select("role, institution_id, institutions(name, slug, logo_url)")
                    .eq("user_id", user.id)
                    .eq("is_active", true)
                    .limit(1)
                    .single();

                if (membership) {
                    const inst = (membership as any).institutions;
                    setAuthInfo({
                        isAuthenticated: true,
                        campusSlug: inst?.slug || null,
                        role: membership.role,
                        fullName: user.user_metadata?.full_name || user.email?.split("@")[0] || null,
                    });
                    return;
                }

                setAuthInfo({ isAuthenticated: true, campusSlug: null, role: null, fullName: null });
                return;
            }

            // Check ERP session
            const erpStatus = await getAuthStatus();
            if (erpStatus.isAuthenticated && erpStatus.session) {
                // ERP session has institution_id, need to look up the slug
                const { data: inst } = await supabase
                    .from("institutions")
                    .select("slug")
                    .eq("id", erpStatus.session.institution_id)
                    .single();

                setAuthInfo({
                    isAuthenticated: true,
                    campusSlug: inst?.slug || null,
                    role: erpStatus.session.role,
                    fullName: erpStatus.session.identifier || null,
                });
            } else {
                setAuthInfo({ isAuthenticated: false, campusSlug: null, role: null, fullName: null });
            }
        };

        checkAuth();
    }, []);

    const roleColors: Record<string, string> = {
        student: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
        faculty: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        admin: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    };

    return (
        <>
            {/* ── Desktop Navigation ── */}
            <header className="fixed left-0 right-0 top-0 z-50 hidden md:block">
                <div className="mx-4 mt-4 md:mx-8">
                    <nav className="flex items-center justify-between rounded-2xl border border-border/40 bg-background/70 px-5 py-2.5 shadow-lg shadow-black/5 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">
                        {/* Logo */}
                        <Link href="/campus" className="flex items-center gap-2.5 shrink-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                                <GraduationCap className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-sm font-bold tracking-tight">
                                Campus<span className="text-primary">olam</span>
                            </span>
                        </Link>

                        {/* Center Links */}
                        <div className="flex items-center gap-1">
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
                            {/* Ariv Social Link */}
                            <Link href="/">
                                <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                                    <Globe className="h-4 w-4" />
                                    Ariv Social
                                </button>
                            </Link>
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center gap-2">
                            <ThemeToggle />

                            {authInfo === null ? (
                                <div className="h-9 w-24 animate-pulse rounded-xl bg-muted" />
                            ) : authInfo.isAuthenticated && authInfo.campusSlug ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-muted/30 px-3 py-1.5 transition-colors hover:bg-muted/60 focus:outline-none">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-medium leading-tight truncate max-w-[120px]">
                                                    {authInfo.fullName || "Campus User"}
                                                </p>
                                                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 mt-0.5 text-[9px] font-bold uppercase tracking-wider ${roleColors[authInfo.role || ""] || "bg-primary/10 text-primary"}`}>
                                                    {authInfo.role}
                                                </span>
                                            </div>
                                            <ChevronRight className="h-3 w-3 text-muted-foreground ml-1" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                        <div className="flex flex-col space-y-1 p-2">
                                            <p className="text-sm font-medium leading-none">{authInfo.fullName || "Campus User"}</p>
                                            <p className="text-xs text-muted-foreground leading-none">{authInfo.role}</p>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild className="gap-2 cursor-pointer rounded-lg">
                                            <Link href={`/campus/${authInfo.campusSlug}/profile`}>
                                                <User className="h-4 w-4" />
                                                Profile Details
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <form action={erpLogout}>
                                            <DropdownMenuItem asChild className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2 cursor-pointer rounded-lg">
                                                <button type="submit" className="w-full flex items-center">
                                                    <LogOut className="h-4 w-4" />
                                                    Sign Out
                                                </button>
                                            </DropdownMenuItem>
                                        </form>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href="/campus/login">
                                        <Button size="sm" variant="ghost" className="gap-2 rounded-xl">
                                            <LogIn className="h-4 w-4" />
                                            Login
                                        </Button>
                                    </Link>
                                    <Link href="/campus/signup">
                                        <Button size="sm" className="gap-2 rounded-xl">
                                            <UserPlus className="h-4 w-4" />
                                            Sign Up
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
            </header>

            {/* ── Mobile: Top-right menu button ── */}
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2 md:hidden">
                <ThemeToggle />
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-full border-border/60 bg-background/80 shadow-md backdrop-blur-md"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-72 p-0">
                        <SheetHeader className="border-b border-border/40 px-5 py-4">
                            <SheetTitle className="flex items-center gap-2.5 text-sm">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                                    <GraduationCap className="h-4 w-4 text-primary" />
                                </div>
                                Campus<span className="text-primary">olam</span>
                            </SheetTitle>
                        </SheetHeader>

                        <nav className="flex flex-col gap-1 p-4">
                            {/* Auth Section (top of menu) */}
                            {authInfo === null ? (
                                <div className="h-16 w-full animate-pulse rounded-xl bg-muted mb-3" />
                            ) : authInfo.isAuthenticated && authInfo.campusSlug ? (
                                <div className="space-y-1 mb-3">
                                    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {authInfo.fullName || "Campus User"}
                                            </p>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mt-0.5 ${roleColors[authInfo.role || ""] || "bg-primary/10 text-primary"}`}>
                                                {authInfo.role}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <Link href={`/campus/${authInfo.campusSlug}/profile`} onClick={() => setIsMenuOpen(false)}>
                                            <Button variant="outline" className="w-full gap-2 rounded-xl text-xs h-9">
                                                <User className="h-3.5 w-3.5" />
                                                Profile
                                            </Button>
                                        </Link>
                                        <form action={erpLogout} className="w-full">
                                            <Button type="submit" variant="outline" className="w-full gap-2 rounded-xl text-xs h-9 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20" onClick={() => setIsMenuOpen(false)}>
                                                <LogOut className="h-3.5 w-3.5" />
                                                Sign Out
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 mb-3">
                                    <Link href="/campus/login" onClick={() => setIsMenuOpen(false)}>
                                        <Button variant="outline" className="w-full gap-2 rounded-xl">
                                            <LogIn className="h-4 w-4" />
                                            Login to Campus
                                        </Button>
                                    </Link>
                                    <Link href="/campus/signup" onClick={() => setIsMenuOpen(false)}>
                                        <Button className="w-full gap-2 rounded-xl">
                                            <UserPlus className="h-4 w-4" />
                                            Sign Up
                                        </Button>
                                    </Link>
                                </div>
                            )}

                            <div className="my-1 border-t border-border/40" />

                            {/* Nav Links */}
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMenuOpen(false)}
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

                            <div className="my-1 border-t border-border/40" />

                            {/* Ariv Social Link */}
                            <Link href="/" onClick={() => setIsMenuOpen(false)}>
                                <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                                    <Globe className="h-4 w-4" />
                                    Ariv Social
                                </button>
                            </Link>
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>

            {/* ── Mobile: Bottom floating dock ── */}
            <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 md:hidden">
                <DockNavigation items={dockItems} />
            </div>
        </>
    );
}
