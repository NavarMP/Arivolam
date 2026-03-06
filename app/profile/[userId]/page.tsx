import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
    params: Promise<{ userId: string }>;
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
    const { userId } = await params;
    const supabase = await createClient();

    // Just fetch the minimal required routing data
    const { data: profile } = await supabase
        .from("arivolam_profiles")
        .select("username, profile_type")
        .eq("id", userId)
        .single();

    if (!profile) {
        notFound();
    }

    // Redirect permanently to the correct canonical URL
    if (profile.profile_type === 'institution') {
        redirect(`/institution/${profile.username || userId}`);
    } else {
        redirect(`/${profile.username || userId}`);
    }
}
