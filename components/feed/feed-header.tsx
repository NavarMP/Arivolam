"use client";

import Link from "next/link";
import Image from "next/image";
import { Bell, Search, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface FeedHeaderProps {
    user: SupabaseUser | null;
}

export function FeedHeader({ user }: FeedHeaderProps) {
    return (
        <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="container mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/assets/Logo.svg" alt="Arivolam" width={32} height={32} className="h-8 w-8" />
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
