import { createClient } from "@/utils/supabase/server";
import { UsersTable } from "@/components/dev-admin/users-table";

async function getUsers() {
    const supabase = await createClient();

    // Get all profiles
    const { data: profiles } = await supabase
        .from("arivolam_profiles")
        .select("id, display_name, username, avatar_url, is_dev_admin, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

    // Get membership info for each profile
    const enriched = await Promise.all(
        (profiles || []).map(async (p) => {
            const { data: memberships } = await supabase
                .from("institution_members")
                .select("role, institutions(name, short_name, slug)")
                .eq("user_id", p.id)
                .eq("is_active", true);

            return {
                ...p,
                memberships: (memberships || []).map((m) => ({
                    role: m.role,
                    institution: (m.institutions as unknown as {
                        name: string;
                        short_name: string | null;
                        slug: string;
                    }),
                })),
            };
        })
    );

    return enriched;
}

export default async function UsersPage() {
    const users = await getUsers();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Users</h1>
                <p className="text-sm text-muted-foreground">
                    All users registered on the Arivolam platform.
                </p>
            </div>

            <UsersTable users={users} />
        </div>
    );
}
