import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CampusLayout } from "@/components/campus/campus-layout";

export default async function CampusSlugLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    // Get institution by slug
    const { data: institution } = await supabase
        .from("institutions")
        .select("id, name, slug, short_name, logo_url")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

    if (!institution) redirect("/");

    // Check user is a member of this institution
    const { data: membership } = await supabase
        .from("institution_members")
        .select("id, role")
        .eq("user_id", user.id)
        .eq("institution_id", institution.id)
        .eq("is_active", true)
        .single();

    if (!membership) redirect("/");

    // Fetch buildings & POIs for AI context
    const [{ data: buildings }, { data: pois }] = await Promise.all([
        supabase
            .from("campus_buildings")
            .select("name, category, description")
            .eq("institution_id", institution.id)
            .eq("is_active", true),
        supabase
            .from("campus_pois")
            .select("name, category")
            .eq("institution_id", institution.id)
            .eq("is_active", true),
    ]);

    const campusContext = {
        institutionName: institution.name,
        buildings: buildings?.map((b: { name: string; category: string; description: string | null }) => ({
            name: b.name,
            category: b.category,
            description: b.description || undefined,
        })) || [],
        pois: pois?.map((p: { name: string; category: string }) => ({
            name: p.name,
            category: p.category,
        })) || [],
    };

    return (
        <CampusLayout
            institution={institution}
            userRole={membership.role}
            slug={slug}
            campusContext={campusContext}
        >
            {children}
        </CampusLayout>
    );
}

