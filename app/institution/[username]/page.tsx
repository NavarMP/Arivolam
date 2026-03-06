import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { InstitutionProfileView } from "@/components/feed/institution-profile-view";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
    params: Promise<{ username: string }>;
}

export default async function InstitutionProfilePage({ params }: ProfilePageProps) {
    const { username } = await params;
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(username);
    const queryFilter = isUuid ? `username.eq."${username}",id.eq."${username}"` : `username.eq."${username}"`;

    const { data: profile } = await supabase
        .from("arivolam_profiles")
        .select(`
            id,
            username,
            display_name,
            headline,
            bio,
            avatar_url,
            cover_url,
            profile_type,
            sub_type,
            location,
            website,
            education,
            skills,
            is_verified,
            is_public,
            followers_count,
            following_count,
            created_at,
            institution_profile_details (*)
        `)
        .or(queryFilter)
        .single();

    if (!profile) notFound();

    // If it's a personal account, redirect back to standard path
    if (profile.profile_type !== 'institution') {
        redirect(`/${profile.username || profile.id}`);
    }

    const isOwnProfile = currentUser?.id === profile.id;

    // Reject if not public and not owner
    if (profile.is_public === false && !isOwnProfile) {
        notFound();
    }

    const { data: posts } = await supabase
        .from("posts")
        .select(`
            id,
            content,
            type,
            media,
            reactions_count,
            comments_count,
            created_at
        `)
        .eq("author_id", profile.id)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(10);

    const { data: memberships } = await supabase
        .from("institution_members")
        .select(`
            role,
            institutions:institution_id (name, slug, short_name)
        `)
        .eq("user_id", profile.id)
        .eq("is_active", true);

    let isFollowing = false;
    if (currentUser && !isOwnProfile) {
        const { data: follow } = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", currentUser.id)
            .eq("following_id", profile.id)
            .single();
        isFollowing = !!follow;
    }

    return (
        <InstitutionProfileView
            profile={profile}
            posts={posts || []}
            memberships={memberships || []}
            isOwnProfile={isOwnProfile}
            currentUser={currentUser}
            isFollowing={isFollowing}
        />
    );
}
