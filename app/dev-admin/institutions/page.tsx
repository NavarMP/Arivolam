import { createClient } from "@/utils/supabase/server";
import { InstitutionsTable } from "@/components/dev-admin/institutions-table";

async function getInstitutions() {
    const supabase = await createClient();

    const { data: institutions } = await supabase
        .from("institutions")
        .select("*")
        .order("created_at", { ascending: false });

    // Get member counts per institution
    const enriched = await Promise.all(
        (institutions || []).map(async (inst) => {
            const { count } = await supabase
                .from("institution_members")
                .select("*", { count: "exact", head: true })
                .eq("institution_id", inst.id)
                .eq("is_active", true);

            return { ...inst, memberCount: count || 0 };
        })
    );

    return enriched;
}

export default async function InstitutionsPage() {
    const institutions = await getInstitutions();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Institutions
                </h1>
                <p className="text-sm text-muted-foreground">
                    Manage all institutions on the Arivolam platform.
                </p>
            </div>

            <InstitutionsTable institutions={institutions} />
        </div>
    );
}
