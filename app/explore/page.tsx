import { createClient } from "@/utils/supabase/server";
import { Search, TrendingUp, Building2, Users, Sparkles, Hash } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { MobileNav } from "@/components/layout/mobile-nav";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch trending/recent posts
    const { data: trendingPosts } = await supabase
        .from("posts")
        .select(`
            id, content, type, media, reactions_count, comments_count, created_at,
            author:author_id (display_name, username, avatar_url, headline)
        `)
        .eq("visibility", "public")
        .order("reactions_count", { ascending: false })
        .limit(6);

    // Fetch institutions
    const { data: institutions } = await supabase
        .from("institutions")
        .select("id, name, slug, short_name, logo_url, type")
        .eq("is_active", true)
        .order("name")
        .limit(8);

    // Fetch active users
    const { data: activeUsers } = await supabase
        .from("arivolam_profiles")
        .select("id, username, display_name, avatar_url, headline, followers_count")
        .eq("is_public", true)
        .not("username", "is", null)
        .order("followers_count", { ascending: false })
        .limit(8);

    const categories = [
        { label: "Education", icon: "📚", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
        { label: "Technology", icon: "💻", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
        { label: "Research", icon: "🔬", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
        { label: "Arts", icon: "🎨", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
        { label: "Sports", icon: "⚽", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
        { label: "Events", icon: "🎭", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    ];

    return (
        <div className="min-h-screen bg-background">
            <DesktopNav user={user} />
            <div className="md:hidden">
                <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/30 bg-background/70 px-4 py-3 backdrop-blur-2xl">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-lg font-bold">Explore</Link>
                    </div>
                </header>
            </div>

            <main className="container mx-auto max-w-4xl px-4 pb-28 pt-20 md:pt-24">
                {/* Hero search */}
                <section className="mb-10 text-center">
                    <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
                        Explore <span className="text-primary">Arivolam</span>
                    </h1>
                    <p className="mb-6 text-muted-foreground">
                        Discover institutions, people, and ideas across the campus universe
                    </p>
                    <div className="mx-auto flex max-w-md items-center gap-2 rounded-2xl border border-border/40 bg-card/60 px-4 py-2 shadow-sm backdrop-blur-sm">
                        <Search className="h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search people, institutions, posts..."
                            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                        />
                    </div>
                </section>

                {/* Category pills */}
                <section className="mb-10">
                    <div className="flex flex-wrap justify-center gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.label}
                                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all hover:scale-105 ${cat.color}`}
                            >
                                <span>{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Institutions */}
                <section className="mb-10">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-bold">
                            <Building2 className="h-5 w-5 text-primary" />
                            Institutions
                        </h2>
                        <Button variant="ghost" size="sm" className="text-xs text-primary">
                            See all →
                        </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {institutions?.map((inst) => (
                            <Link
                                key={inst.id}
                                href={`/campus/${inst.slug}`}
                                className="group rounded-xl border border-border/40 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
                            >
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary font-bold text-lg">
                                    {inst.logo_url ? (
                                        <img src={inst.logo_url} alt={inst.name} className="h-8 w-8 rounded-lg object-contain" />
                                    ) : (
                                        inst.short_name?.charAt(0) || inst.name.charAt(0)
                                    )}
                                </div>
                                <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                    {inst.short_name || inst.name}
                                </h3>
                                <p className="text-xs text-muted-foreground capitalize">{inst.type || "Institution"}</p>
                            </Link>
                        ))}
                        {(!institutions || institutions.length === 0) && (
                            <p className="col-span-full text-center text-sm text-muted-foreground py-8">
                                No institutions found
                            </p>
                        )}
                    </div>
                </section>

                {/* People */}
                <section className="mb-10">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-bold">
                            <Users className="h-5 w-5 text-primary" />
                            People
                        </h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {activeUsers?.map((person) => (
                            <Link
                                key={person.id}
                                href={person.username ? `/${person.username}` : `/profile/${person.id}`}
                                className="group flex flex-col items-center gap-2 rounded-xl border border-border/40 bg-card p-4 text-center transition-all hover:border-primary/30 hover:shadow-md"
                            >
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-xl font-bold">
                                    {person.avatar_url ? (
                                        <img src={person.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                                    ) : (
                                        person.display_name?.charAt(0).toUpperCase() || "U"
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                        {person.display_name}
                                    </p>
                                    {person.username && (
                                        <p className="text-xs text-muted-foreground">@{person.username}</p>
                                    )}
                                    {person.headline && (
                                        <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-[150px]">
                                            {person.headline}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                        {(!activeUsers || activeUsers.length === 0) && (
                            <p className="col-span-full text-center text-sm text-muted-foreground py-8">
                                No users found
                            </p>
                        )}
                    </div>
                </section>

                {/* Trending posts */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-bold">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Trending
                        </h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {trendingPosts?.map((post) => {
                            const author = post.author as unknown as {
                                display_name: string;
                                username: string;
                                avatar_url: string | null;
                                headline: string | null;
                            };
                            return (
                                <article
                                    key={post.id}
                                    className="rounded-xl border border-border/40 bg-card p-4 transition-all hover:shadow-md"
                                >
                                    <div className="mb-2 flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                                            {author?.display_name?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold">{author?.display_name}</p>
                                            {author?.headline && (
                                                <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                                    {author.headline}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="mb-2 text-sm line-clamp-3">{post.content}</p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        {post.reactions_count > 0 && <span>👍 {post.reactions_count}</span>}
                                        {post.comments_count > 0 && <span>💬 {post.comments_count}</span>}
                                    </div>
                                </article>
                            );
                        })}
                        {(!trendingPosts || trendingPosts.length === 0) && (
                            <div className="col-span-full flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                                <Sparkles className="h-8 w-8" />
                                <p className="text-sm">No trending posts yet. Be the first!</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <MobileNav user={user} />
        </div>
    );
}
