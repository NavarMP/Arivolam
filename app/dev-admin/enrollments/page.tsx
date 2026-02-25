import { createClient } from "@/utils/supabase/server";

async function getEnrollments() {
    const supabase = await createClient();

    const { data: enrollments } = await supabase
        .from("enrollments")
        .select(`
            id,
            email,
            phone,
            register_number,
            admission_number,
            username,
            role,
            department,
            is_approved,
            is_claimed,
            created_at,
            institutions:institution_id (
                id, name, short_name, slug
            )
        `)
        .order("created_at", { ascending: false })
        .limit(200);

    return enrollments || [];
}

export default async function EnrollmentsPage() {
    const enrollments = await getEnrollments();

    const pending = enrollments.filter((e) => !e.is_approved);
    const approved = enrollments.filter((e) => e.is_approved);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Enrollments</h1>
                <p className="text-sm text-muted-foreground">
                    Cross-institution enrollment overview — all pending and approved enrollment records.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                    <p className="text-2xl font-bold">{enrollments.length}</p>
                    <p className="text-xs text-muted-foreground">Total Enrollments</p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm">
                    <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
                    <p className="text-xs text-amber-600/70">Pending Approval</p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
                    <p className="text-2xl font-bold text-emerald-600">{approved.length}</p>
                    <p className="text-xs text-emerald-600/70">Approved</p>
                </div>
            </div>

            {/* Pending Enrollments */}
            {pending.length > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-card shadow-sm">
                    <div className="border-b border-border/50 px-5 py-4">
                        <h2 className="text-sm font-semibold text-amber-600">
                            Pending Approvals ({pending.length})
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/30">
                                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">User</th>
                                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Institution</th>
                                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Role</th>
                                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">IDs</th>
                                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {pending.map((e: any) => (
                                    <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-2.5">
                                            <p className="font-medium text-sm">{e.email || e.username}</p>
                                            {e.phone && <p className="text-[10px] text-muted-foreground">{e.phone}</p>}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs">
                                            {e.institutions?.short_name || e.institutions?.name || "—"}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary capitalize">
                                                {e.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                                            {e.register_number && <span>Reg: {e.register_number}</span>}
                                            {e.admission_number && <span className="ml-2">Adm: {e.admission_number}</span>}
                                        </td>
                                        <td className="px-4 py-2.5 text-xs text-muted-foreground">
                                            {new Date(e.created_at).toLocaleDateString("en-IN", {
                                                day: "numeric", month: "short",
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* All Enrollments */}
            <div className="rounded-xl border border-border/50 bg-card shadow-sm">
                <div className="border-b border-border/50 px-5 py-4">
                    <h2 className="text-sm font-semibold">All Enrollments ({enrollments.length})</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50 bg-muted/30">
                                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">User</th>
                                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Institution</th>
                                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Role</th>
                                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Claimed</th>
                                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {enrollments.map((e: any) => (
                                <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-2.5">
                                        <p className="font-medium text-sm">{e.email || e.username}</p>
                                        {e.department && <p className="text-[10px] text-muted-foreground">{e.department}</p>}
                                    </td>
                                    <td className="px-4 py-2.5 text-xs">
                                        {e.institutions?.short_name || e.institutions?.name || "—"}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary capitalize">
                                            {e.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${e.is_approved
                                            ? "bg-emerald-500/10 text-emerald-600"
                                            : "bg-amber-500/10 text-amber-600"
                                            }`}>
                                            {e.is_approved ? "Approved" : "Pending"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                                        {e.is_claimed ? "✓ Linked" : "—"}
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                                        {new Date(e.created_at).toLocaleDateString("en-IN", {
                                            day: "numeric", month: "short", year: "numeric",
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {enrollments.length === 0 && (
                    <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                        No enrollments found
                    </div>
                )}
            </div>
        </div>
    );
}
