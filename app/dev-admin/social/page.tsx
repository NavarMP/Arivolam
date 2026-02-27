import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import {
    Users,
    MessageSquare,
    Heart,
    TrendingUp,
    Calendar,
    Shield,
    Eye,
} from "lucide-react";

async function getSocialStats() {
    const supabase = await createClient();

    const [
        { count: totalUsers },
        { count: totalPosts },
        { count: totalLikes },
        { count: verifiedUsers },
    ] = await Promise.all([
        supabase.from("arivolam_profiles").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("post_likes").select("*", { count: "exact", head: true }),
        supabase.from("arivolam_profiles").select("*", { count: "exact", head: true }).eq("is_verified", true),
    ]);

    // Recent signups (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: recentSignups } = await supabase
        .from("arivolam_profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString());

    // Recent posts (last 7 days)
    const { count: recentPosts } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString());

    // Latest posts
    const { data: latestPosts } = await supabase
        .from("posts")
        .select(`
            id,
            content,
            created_at,
            likes_count,
            comments_count,
            user_id,
            arivolam_profiles:user_id (display_name, username, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

    // Latest users
    const { data: latestUsers } = await supabase
        .from("arivolam_profiles")
        .select("id, display_name, username, avatar_url, is_dev_admin, is_verified, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

    return {
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
        totalLikes: totalLikes || 0,
        verifiedUsers: verifiedUsers || 0,
        recentSignups: recentSignups || 0,
        recentPosts: recentPosts || 0,
        latestPosts: latestPosts || [],
        latestUsers: latestUsers || [],
    };
}

export default async function SocialDashboardPage() {
    const stats = await getSocialStats();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Ariv Social Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Overview of the social platform — users, posts, and engagement.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {[
                    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-primary bg-primary/10" },
                    { label: "Total Posts", value: stats.totalPosts, icon: MessageSquare, color: "text-blue-500 bg-blue-500/10" },
                    { label: "Total Likes", value: stats.totalLikes, icon: Heart, color: "text-rose-500 bg-rose-500/10" },
                    { label: "Verified", value: stats.verifiedUsers, icon: Shield, color: "text-emerald-500 bg-emerald-500/10" },
                    { label: "New Users (7d)", value: stats.recentSignups, icon: TrendingUp, color: "text-violet-500 bg-violet-500/10" },
                    { label: "New Posts (7d)", value: stats.recentPosts, icon: Calendar, color: "text-amber-500 bg-amber-500/10" },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color.split(" ")[1]}`}>
                                <Icon className={`h-4 w-4 ${color.split(" ")[0]}`} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Users */}
                <div className="rounded-xl border border-border/50 bg-card shadow-sm">
                    <div className="border-b border-border/50 px-5 py-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            Recent Users
                        </h2>
                        <Link href="/dev-admin/users" className="text-xs text-primary hover:underline">
                            View all →
                        </Link>
                    </div>
                    <div className="divide-y divide-border/50">
                        {stats.latestUsers.length === 0 ? (
                            <div className="px-5 py-8 text-center text-sm text-muted-foreground">No users yet</div>
                        ) : (
                            stats.latestUsers.map((user: any) => (
                                <div key={user.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary overflow-hidden">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                                        ) : (
                                            (user.display_name?.charAt(0) || "U").toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-medium truncate">{user.display_name || "Anonymous"}</p>
                                            {user.is_dev_admin && (
                                                <span className="inline-flex items-center rounded-full bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold text-destructive">
                                                    DEV
                                                </span>
                                            )}
                                            {user.is_verified && (
                                                <span className="inline-flex items-center rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold text-blue-500">
                                                    ✓
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground truncate">
                                            {user.username ? `@${user.username}` : user.id.slice(0, 8) + "…"}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                        {new Date(user.created_at).toLocaleDateString("en-IN", {
                                            day: "numeric", month: "short",
                                        })}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Posts */}
                <div className="rounded-xl border border-border/50 bg-card shadow-sm">
                    <div className="border-b border-border/50 px-5 py-4">
                        <h2 className="text-sm font-semibold flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                            Recent Posts
                        </h2>
                    </div>
                    <div className="divide-y divide-border/50">
                        {stats.latestPosts.length === 0 ? (
                            <div className="px-5 py-8 text-center text-sm text-muted-foreground">No posts yet</div>
                        ) : (
                            stats.latestPosts.map((post: any) => (
                                <div key={post.id} className="px-5 py-3 hover:bg-muted/20 transition-colors">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary overflow-hidden">
                                            {post.arivolam_profiles?.avatar_url ? (
                                                <img src={post.arivolam_profiles.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                                            ) : (
                                                (post.arivolam_profiles?.display_name?.charAt(0) || "U").toUpperCase()
                                            )}
                                        </div>
                                        <span className="text-xs font-medium truncate">
                                            {post.arivolam_profiles?.display_name || "Anonymous"}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                                            {new Date(post.created_at).toLocaleDateString("en-IN", {
                                                day: "numeric", month: "short",
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {post.content || "(media post)"}
                                    </p>
                                    <div className="flex items-center gap-4 mt-1.5 text-[10px] text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Heart className="h-3 w-3" /> {post.likes_count || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="h-3 w-3" /> {post.comments_count || 0}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
