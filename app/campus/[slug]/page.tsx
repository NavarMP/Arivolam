import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CampusRouterPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();

    // Get current Supabase Auth user (may be null for ERP-only users)
    const { data: { user } } = await supabase.auth.getUser();

    // Get ERP JWT session (may be null for Supabase Auth-only users)
    const erpSession = await getSession();

    if (!user && !erpSession) redirect("/campus/login");

    const { data: institution } = await supabase
        .from("institutions")
        .select("id")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

    if (!institution) redirect("/campus");

    let userRole = "visitor";

    if (user) {
        const { data: membership } = await supabase
            .from("institution_members")
            .select("role")
            .eq("user_id", user.id)
            .eq("institution_id", institution.id)
            .eq("is_active", true)
            .single();

        if (membership) {
            userRole = membership.role;
        }
    }

    if (erpSession && erpSession.institution_id === institution.id) {
        userRole = erpSession.role;
    }

    // Redirect based on role
    if (userRole === "admin") {
        redirect(`/campus/${slug}/admin`);
    } else if (userRole === "teacher" || userRole === "staff") {
        redirect(`/campus/${slug}/teacher`);
    } else if (userRole === "parent") {
        redirect(`/campus/${slug}/parent`);
    } else {
        redirect(`/campus/${slug}/student`);
    }
}
