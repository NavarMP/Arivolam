"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/utils/supabase/client";
import { signOut } from "@/app/auth/actions";
import { User, LogOut, Settings, LayoutDashboard } from "lucide-react";
import Link from "next/link";
// Need a server action to securely get the ERP session because cookies can't be read in client components easily without extra setup.
import { getAuthStatus } from "@/app/campus/actions"; // We'll create this or use existing

type UserIdentity = {
    name: string;
    email: string;
    role?: string;
    avatarUrl?: string;
    isErp?: boolean;
    campusSlug?: string;
};

export function UserNav() {
    const [user, setUser] = useState<UserIdentity | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchIdentity = async () => {
            try {
                // 1. Try Supabase Auth First
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (authUser) {
                    setUser({
                        name: authUser.user_metadata?.full_name || "User",
                        email: authUser.email || "",
                        role: authUser.user_metadata?.role,
                        avatarUrl: authUser.user_metadata?.avatar_url,
                        isErp: false,
                    });
                    setLoading(false);
                    return;
                }

                // 2. Try ERP JWT Fallback natively via server action
                const erpStatus = await getAuthStatus();
                if (erpStatus.isAuthenticated && erpStatus.session) {
                    // Fetch light enrollment details
                    const { data: enrollment } = await supabase
                        .from("enrollments")
                        .select("full_name, email, role, institutions(slug)")
                        .eq("id", erpStatus.session.enrollment_id)
                        .single() as any; // Type assertion to bypass inferred 'never' on joined tables

                    if (enrollment) {
                        setUser({
                            name: enrollment.full_name || "Campus User",
                            email: enrollment.email || erpStatus.session.identifier,
                            role: enrollment.role,
                            isErp: true,
                            campusSlug: Array.isArray(enrollment.institutions)
                                ? enrollment.institutions[0]?.slug
                                : enrollment.institutions?.slug
                        });
                        setLoading(false);
                        return;
                    }
                }

                setUser(null);
            } catch (err) {
                console.error("Error fetching user identity:", err);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchIdentity();
    }, [supabase]);

    if (loading) {
        return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />;
    }

    if (!user) {
        return (
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="hidden md:flex rounded-xl">
                    <Link href="/auth/login">Log In</Link>
                </Button>
                <Button size="sm" asChild className="rounded-xl">
                    <Link href="/auth/signup">Get Started</Link>
                </Button>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-1 ring-border/50 hover:ring-border transition-all">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatarUrl || ""} alt={user.name || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2 rounded-xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-2">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none text-foreground truncate">
                            {user.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                            {user.email}
                        </p>
                        {user.role && (
                            <div className="pt-1.5 flex items-center">
                                <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-400 ring-1 ring-inset ring-indigo-700/10 dark:ring-indigo-400/20 capitalize">
                                    {user.role} {user.isErp && "(Campus)"}
                                </span>
                            </div>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuGroup className="space-y-1">
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link href={user.isErp && user.campusSlug ? `/campus/${user.campusSlug}/${user.role}` : "/"} className="flex w-full items-center">
                            <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Dashboard</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link href={user.isErp && user.campusSlug ? `/campus/${user.campusSlug}/profile` : "/profile"} className="flex w-full items-center">
                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Profile</span>
                        </Link>
                    </DropdownMenuItem>
                    {!user.isErp && (
                        <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                            <Link href="/settings" className="flex w-full items-center">
                                <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>Settings</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="my-2" />
                <form action={signOut}>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <button type="submit" className="flex w-full items-center">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </button>
                    </DropdownMenuItem>
                </form>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
