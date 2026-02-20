"use client";

import Link from "next/link";
import { Bell, Search, Building2, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdaptiveLogo } from "@/components/shared/adaptive-logo";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/auth/actions";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface FeedHeaderProps {
    user: SupabaseUser | null;
}

export function FeedHeader({ user }: FeedHeaderProps) {
    return (
        <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-2xl">
            <div className="container mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <AdaptiveLogo size={32} />
                    <span className="text-lg font-bold tracking-tight hidden sm:inline">
                        Arivolam
                    </span>
                </Link>

                {/* Right actions */}
                <div className="flex items-center gap-1">
                    <Link href="/explore">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                            <Search className="h-4 w-4" />
                        </Button>
                    </Link>

                    {user ? (
                        <>
                            <Link href="/auth/institution-login">
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                                    <Building2 className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full relative">
                                <Bell className="h-4 w-4" />
                                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
                            </Button>

                            {/* User dropdown with sign-out */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                            {user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel className="font-normal">
                                        <p className="text-sm font-medium truncate">
                                            {user.user_metadata?.full_name || "User"}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {user.email}
                                        </p>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href={`/profile/${user.id}`} className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => signOut()}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <Link href="/auth/login">
                            <Button size="sm" className="rounded-full text-xs font-semibold">
                                Sign In
                            </Button>
                        </Link>
                    )}

                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
