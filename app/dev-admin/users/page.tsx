import { createClient } from "@/utils/supabase/server";
import { UsersTable } from "@/components/dev-admin/users-table";

async function getUsers() {
    const supabase = await createClient();

    const { data: profiles } = await supabase
        .from("arivolam_profiles")
        .select("id, display_name, username, avatar_url, is_dev_admin, created_at")
        .order("created_at", { ascending: false });

    // Enrich each profile with institution memberships
    const enriched = await Promise.all(
        (profiles || []).map(async (profile) => {
            const { data: memberships } = await supabase
                .from("institution_members")
                .select("role, institutions:institution_id (id, name, short_name, slug)")
                .eq("user_id", profile.id)
                .eq("is_active", true);

            return {
                ...profile,
                memberships: (memberships || []).map((m: any) => ({
                    role: m.role,
                    institution: m.institutions,
                })),
            };
        })
    );

    return enriched;
}

async function getUserStats() {
    const supabase = await createClient();

    const [
        { count: totalProfiles },
        { count: devAdmins },
        { count: totalEnrollments },
        { count: campusEnrollments },
    ] = await Promise.all([
        supabase.from("arivolam_profiles").select("*", { count: "exact", head: true }),
        supabase.from("arivolam_profiles").select("*", { count: "exact", head: true }).eq("is_dev_admin", true),
        supabase.from("enrollments").select("*", { count: "exact", head: true }),
        supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("is_approved", true),
    ]);

    const { count: institutionMembers } = await supabase
        .from("institution_members")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

    return {
        totalProfiles: totalProfiles || 0,
        devAdmins: devAdmins || 0,
        totalEnrollments: totalEnrollments || 0,
        campusEnrollments: campusEnrollments || 0,
        institutionMembers: institutionMembers || 0,
    };
}

export default async function UsersPage() {
    const [users, stats] = await Promise.all([getUsers(), getUserStats()]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">All Platform Users</h1>
                <p className="text-sm text-muted-foreground">
                    Manage users across Ariv Social and Campusolam.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                {[
                    { label: "Ariv Social Users", value: stats.totalProfiles, color: "text-primary" },
                    { label: "Dev Admins", value: stats.devAdmins, color: "text-red-500" },
                    { label: "Institution Members", value: stats.institutionMembers, color: "text-blue-500" },
                    { label: "Campus Enrollments", value: stats.totalEnrollments, color: "text-violet-500" },
                    { label: "Approved Enrollments", value: stats.campusEnrollments, color: "text-emerald-500" },
                ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                ))}
            </div>

            <UsersTable users={users} />
        </div>
    );
}
