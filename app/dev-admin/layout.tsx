import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DevAdminShell } from "@/components/dev-admin/dev-admin-shell";

export const metadata = {
    title: "Dev Admin — Arivolam",
    description: "Arivolam platform administration panel",
};

export default async function DevAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login?next=/dev-admin");

    // Double-check dev admin access (proxy also checks, but defense-in-depth)
    const { data: profile } = await supabase
        .from("arivolam_profiles")
        .select("is_dev_admin, display_name")
        .eq("id", user.id)
        .single();

    if (!profile?.is_dev_admin) redirect("/");

    return (
        <DevAdminShell
            user={{ email: user.email || "", name: profile.display_name || user.email || "" }}
        >
            {children}
        </DevAdminShell>
    );
}
