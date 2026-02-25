import { createClient } from "@/utils/supabase/server";
import {
    MessageSquare,
    Users,
    Heart,
    TrendingUp,
    AlertCircle,
    Trash2,
} from "lucide-react";

async function getSocialStats() {
    const supabase = await createClient();

    const [
        { count: postCount },
        { count: profileCount },
    ] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("arivolam_profiles").select("*", { count: "exact", head: true }),
    ]);

    // Recent activity (7d)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentPosts } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo);

    const { count: recentSignups } = await supabase
        .from("arivolam_profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo);

    // Get recent posts with user info
    const { data: latestPosts } = await supabase
        .from("posts")
        .select("id, content, created_at, user_id, arivolam_profiles(display_name, username, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(10);

    return {
        postCount: postCount || 0,
        profileCount: profileCount || 0,
        recentPosts: recentPosts || 0,
        recentSignups: recentSignups || 0,
        latestPosts: latestPosts || [],
    };
}

export default async function SocialDashboardPage() {
    const stats = await getSocialStats();

    const cards = [
        {
            label: "Total Posts",
            value: stats.postCount,
            icon: MessageSquare,
            color: "text-pink-500",
            bg: "bg-pink-500/10",
        },
        {
            label: "Total Users",
            value: stats.profileCount,
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            label: "Posts (7d)",
            value: stats.recentPosts,
            icon: TrendingUp,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
        {
            label: "New Users (7d)",
            value: stats.recentSignups,
            icon: Heart,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Ariv Social</h1>
                <p className="text-sm text-muted-foreground">
                    Monitor and manage the Arivolam social platform — posts, users, and engagement.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}>
                                <card.icon className={`h-4 w-4 ${card.color}`} />
                            </div>
                        </div>
                        <p className="mt-3 text-2xl font-bold">{card.value}</p>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Recent Posts */}
            <div className="rounded-xl border border-border/50 bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
                    <h2 className="text-sm font-semibold">Recent Posts</h2>
                    <span className="text-xs text-muted-foreground">Last 10 posts</span>
                </div>
                <div className="divide-y divide-border/50">
                    {stats.latestPosts.length > 0 ? (
                        stats.latestPosts.map((post: any) => (
                            <div key={post.id} className="flex items-start gap-3 px-5 py-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary overflow-hidden">
                                    {post.arivolam_profiles?.avatar_url ? (
                                        <img
                                            src={post.arivolam_profiles.avatar_url}
                                            alt=""
                                            className="h-8 w-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        (post.arivolam_profiles?.display_name?.charAt(0) || "?").toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">
                                        {post.arivolam_profiles?.display_name || "Unknown User"}
                                        <span className="text-muted-foreground font-normal ml-1 text-xs">
                                            @{post.arivolam_profiles?.username || "—"}
                                        </span>
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                        {post.content || "(empty post)"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                                        {new Date(post.created_at).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                            No posts yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
