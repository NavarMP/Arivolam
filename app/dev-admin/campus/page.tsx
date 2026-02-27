import { createClient } from "@/utils/supabase/server";
import { InstitutionsTable } from "@/components/dev-admin/institutions-table";
import Link from "next/link";

async function getInstitutions() {
    const supabase = await createClient();

    const { data: institutions } = await supabase
        .from("institutions")
        .select("*")
        .order("created_at", { ascending: false });

    // Get member counts and enrollment counts per institution
    const enriched = await Promise.all(
        (institutions || []).map(async (inst) => {
            const [
                { count: memberCount },
                { count: enrollmentCount },
                { count: pendingCount },
            ] = await Promise.all([
                supabase
                    .from("institution_members")
                    .select("*", { count: "exact", head: true })
                    .eq("institution_id", inst.id)
                    .eq("is_active", true),
                supabase
                    .from("enrollments")
                    .select("*", { count: "exact", head: true })
                    .eq("institution_id", inst.id),
                supabase
                    .from("enrollments")
                    .select("*", { count: "exact", head: true })
                    .eq("institution_id", inst.id)
                    .eq("is_approved", false),
            ]);

            return {
                ...inst,
                memberCount: memberCount || 0,
                enrollmentCount: enrollmentCount || 0,
                pendingCount: pendingCount || 0,
            };
        })
    );

    return enriched;
}

async function getCampusStats() {
    const supabase = await createClient();

    const [
        { count: totalInstitutions },
        { count: activeInstitutions },
        { count: totalEnrollments },
        { count: totalMembers },
    ] = await Promise.all([
        supabase.from("institutions").select("*", { count: "exact", head: true }),
        supabase.from("institutions").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("enrollments").select("*", { count: "exact", head: true }),
        supabase.from("institution_members").select("*", { count: "exact", head: true }),
    ]);

    const { count: pendingEnrollments } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("is_approved", false);

    return {
        totalInstitutions: totalInstitutions || 0,
        activeInstitutions: activeInstitutions || 0,
        totalEnrollments: totalEnrollments || 0,
        totalMembers: totalMembers || 0,
        pendingEnrollments: pendingEnrollments || 0,
    };
}

export default async function CampusManagementPage() {
    const [institutions, stats] = await Promise.all([
        getInstitutions(),
        getCampusStats(),
    ]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Campusolam Management</h1>
                <p className="text-sm text-muted-foreground">
                    Manage all institutions, enrollments, and campus infrastructure.
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                {[
                    { label: "Total Institutions", value: stats.totalInstitutions, color: "text-blue-500 bg-blue-500/10" },
                    { label: "Active", value: stats.activeInstitutions, color: "text-emerald-500 bg-emerald-500/10" },
                    { label: "Total Enrollments", value: stats.totalEnrollments, color: "text-violet-500 bg-violet-500/10" },
                    { label: "Linked Members", value: stats.totalMembers, color: "text-orange-500 bg-orange-500/10" },
                    { label: "Pending Approvals", value: stats.pendingEnrollments, color: "text-amber-500 bg-amber-500/10" },
                ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Institutions Table */}
            <InstitutionsTable institutions={institutions} />
        </div>
    );
}
