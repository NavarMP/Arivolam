import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CampusLayout } from "@/components/campus/campus-layout";
import { getSession } from "@/lib/auth";

export default async function CampusSlugLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    console.log("LAYOUT HIT WITH SLUG:", slug);

    // Reserved static route names under /campus/ — let them pass through
    // without auth so their own route handlers can serve them
    const RESERVED_SLUGS = ["explore", "login", "signup", "create", "guide"];
    if (RESERVED_SLUGS.includes(slug)) {
        return <>{children}</>;
    }

    const supabase = await createClient();

    // Get current Supabase Auth user (may be null for ERP-only users)
    const { data: { user } } = await supabase.auth.getUser();

    // Get ERP JWT session (may be null for Supabase Auth-only users)
    const erpSession = await getSession();

    // Must have at least one auth method
    if (!user && !erpSession) redirect("/campus/login");

    // Get institution by slug
    const { data: institution } = await supabase
        .from("institutions")
        .select("id, name, slug, short_name, logo_url")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

    if (!institution) redirect("/campus");

    // Determine user role from either auth method
    let userRole = "visitor";

    // Method 1: Check Supabase Auth membership
    if (user) {
        const { data: membership } = await supabase
            .from("institution_members")
            .select("id, role")
            .eq("user_id", user.id)
            .eq("institution_id", institution.id)
            .eq("is_active", true)
            .single();

        if (membership) {
            userRole = membership.role;
        }
    }

    // Method 2: Check ERP JWT session (takes priority if it matches this institution)
    if (erpSession && erpSession.institution_id === institution.id) {
        userRole = erpSession.role;
    }

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
            userRole={userRole}
            slug={slug}
            campusContext={campusContext}
        >
            {children}
        </CampusLayout>
    );
}
