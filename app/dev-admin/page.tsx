import { createClient } from "@/utils/supabase/server";
import {
    Building2,
    Users,
    MapPin,
    MessageSquare,
    TrendingUp,
    Activity,
} from "lucide-react";

async function getStats() {
    const supabase = await createClient();

    const [
        { count: institutionCount },
        { count: profileCount },
        { count: memberCount },
        { count: buildingCount },
        { count: postCount },
    ] = await Promise.all([
        supabase.from("institutions").select("*", { count: "exact", head: true }),
        supabase.from("arivolam_profiles").select("*", { count: "exact", head: true }),
        supabase.from("institution_members").select("*", { count: "exact", head: true }),
        supabase.from("campus_buildings").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
    ]);

    // Get recent signups (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentSignups } = await supabase
        .from("arivolam_profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo);

    // Get institutions list for quick access
    const { data: institutions } = await supabase
        .from("institutions")
        .select("id, name, short_name, slug, city, state, logo_url, is_active")
        .order("created_at", { ascending: false })
        .limit(5);

    return {
        institutionCount: institutionCount || 0,
        profileCount: profileCount || 0,
        memberCount: memberCount || 0,
        buildingCount: buildingCount || 0,
        postCount: postCount || 0,
        recentSignups: recentSignups || 0,
        recentInstitutions: institutions || [],
    };
}

export default async function DevAdminPage() {
    const stats = await getStats();

    const cards = [
        {
            label: "Institutions",
            value: stats.institutionCount,
            icon: Building2,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            label: "Total Users",
            value: stats.profileCount,
            icon: Users,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
        {
            label: "Institution Members",
            value: stats.memberCount,
            icon: TrendingUp,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
        },
        {
            label: "Campus Buildings",
            value: stats.buildingCount,
            icon: MapPin,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
        },
        {
            label: "Posts",
            value: stats.postCount,
            icon: MessageSquare,
            color: "text-pink-500",
            bg: "bg-pink-500/10",
        },
        {
            label: "Signups (7d)",
            value: stats.recentSignups,
            icon: Activity,
            color: "text-cyan-500",
            bg: "bg-cyan-500/10",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Platform Overview
                </h1>
                <p className="text-sm text-muted-foreground">
                    Arivolam superadmin dashboard — monitor all institutions, users, and platform health.
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
                    >
                        <div className="flex items-center justify-between">
                            <div
                                className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}
                            >
                                <card.icon className={`h-4 w-4 ${card.color}`} />
                            </div>
                        </div>
                        <p className="mt-3 text-2xl font-bold">{card.value}</p>
                        <p className="text-xs text-muted-foreground">
                            {card.label}
                        </p>
                    </div>
                ))}
            </div>

            {/* Recent institutions */}
            <div className="rounded-xl border border-border/50 bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
                    <h2 className="text-sm font-semibold">Recent Institutions</h2>
                    <a
                        href="/dev-admin/institutions"
                        className="text-xs font-medium text-primary hover:underline"
                    >
                        View all →
                    </a>
                </div>
                <div className="divide-y divide-border/50">
                    {stats.recentInstitutions.length > 0 ? (
                        stats.recentInstitutions.map((inst) => (
                            <div
                                key={inst.id}
                                className="flex items-center gap-3 px-5 py-3"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
                                    <img
                                        src={inst.logo_url || "/assets/Logo.svg"}
                                        alt={inst.name}
                                        className="h-7 w-7 object-contain"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {inst.short_name || inst.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {inst.city}
                                        {inst.state ? `, ${inst.state}` : ""} — /{inst.slug}
                                    </p>
                                </div>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${inst.is_active
                                            ? "bg-emerald-500/10 text-emerald-600"
                                            : "bg-muted text-muted-foreground"
                                        }`}
                                >
                                    {inst.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                            No institutions yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
