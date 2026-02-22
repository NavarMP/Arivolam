"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, User, FileText, Hash } from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { createClient } from "@/utils/supabase/client";

interface SearchResult {
    id: string;
    type: "user" | "institution" | "post";
    title: string;
    subtitle?: string;
    href: string;
    avatar?: string;
}

export function SearchCommand() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // ⌘K shortcut
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const search = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            return;
        }

        setLoading(true);
        const supabase = createClient();
        const searchResults: SearchResult[] = [];

        // Search users
        const { data: users } = await supabase
            .from("arivolam_profiles")
            .select("id, username, display_name, headline, avatar_url")
            .or(`display_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%,headline.ilike.%${searchQuery}%`)
            .limit(5);

        if (users) {
            users.forEach((u) => {
                searchResults.push({
                    id: u.id,
                    type: "user",
                    title: u.display_name || u.username || "User",
                    subtitle: u.headline || (u.username ? `@${u.username}` : undefined),
                    href: u.username ? `/${u.username}` : `/profile/${u.id}`,
                    avatar: u.avatar_url || undefined,
                });
            });
        }

        // Search institutions
        const { data: institutions } = await supabase
            .from("institutions")
            .select("id, name, short_name, slug, city, state")
            .or(`name.ilike.%${searchQuery}%,short_name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`)
            .limit(5);

        if (institutions) {
            institutions.forEach((inst) => {
                searchResults.push({
                    id: inst.id,
                    type: "institution",
                    title: inst.short_name || inst.name,
                    subtitle: [inst.city, inst.state].filter(Boolean).join(", "),
                    href: `/campus/${inst.slug}`,
                });
            });
        }

        // Search posts (content)
        const { data: posts } = await supabase
            .from("posts")
            .select("id, content, author_id")
            .eq("visibility", "public")
            .ilike("content", `%${searchQuery}%`)
            .order("created_at", { ascending: false })
            .limit(5);

        if (posts) {
            posts.forEach((p) => {
                searchResults.push({
                    id: p.id,
                    type: "post",
                    title: p.content.slice(0, 80) + (p.content.length > 80 ? "..." : ""),
                    href: `/`, // Posts link to feed for now
                });
            });
        }

        setResults(searchResults);
        setLoading(false);
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => search(query), 300);
        return () => clearTimeout(timer);
    }, [query, search]);

    const navigateTo = (href: string) => {
        setOpen(false);
        setQuery("");
        router.push(href);
    };

    const users = results.filter((r) => r.type === "user");
    const institutions = results.filter((r) => r.type === "institution");
    const posts = results.filter((r) => r.type === "post");

    return (
        <>
            {/* Trigger button */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground transition-all hover:border-primary/40 hover:bg-background"
            >
                <Search className="h-3.5 w-3.5" />
                <span>Search...</span>
                <kbd className="ml-auto hidden rounded border border-border/60 bg-muted px-1 py-0.5 text-[10px] font-medium lg:inline">
                    ⌘K
                </kbd>
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Search users, campuses, posts..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    {query.length < 2 ? (
                        <CommandEmpty>Type to start searching...</CommandEmpty>
                    ) : loading ? (
                        <CommandEmpty>Searching...</CommandEmpty>
                    ) : results.length === 0 ? (
                        <CommandEmpty>No results found for &ldquo;{query}&rdquo;</CommandEmpty>
                    ) : (
                        <>
                            {users.length > 0 && (
                                <CommandGroup heading="People">
                                    {users.map((user) => (
                                        <CommandItem
                                            key={user.id}
                                            onSelect={() => navigateTo(user.href)}
                                            className="gap-3"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                                                {user.avatar ? (
                                                    <img
                                                        src={user.avatar}
                                                        alt=""
                                                        className="h-full w-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="h-3.5 w-3.5" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{user.title}</p>
                                                {user.subtitle && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {user.subtitle}
                                                    </p>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {institutions.length > 0 && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup heading="Campuses">
                                        {institutions.map((inst) => (
                                            <CommandItem
                                                key={inst.id}
                                                onSelect={() => navigateTo(inst.href)}
                                                className="gap-3"
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                                                    <Building2 className="h-4 w-4 text-blue-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{inst.title}</p>
                                                    {inst.subtitle && (
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {inst.subtitle}
                                                        </p>
                                                    )}
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}

                            {posts.length > 0 && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup heading="Posts">
                                        {posts.map((post) => (
                                            <CommandItem
                                                key={post.id}
                                                onSelect={() => navigateTo(post.href)}
                                                className="gap-3"
                                            >
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 shrink-0">
                                                    <FileText className="h-4 w-4 text-emerald-500" />
                                                </div>
                                                <p className="text-sm truncate">{post.title}</p>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}
                        </>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
