import { createClient } from "@/utils/supabase/server";
import { FeedContent } from "@/components/feed/feed-content";

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch posts with author profile
    const { data: posts } = await supabase
        .from("posts")
        .select(`
            *,
            author:author_id (
                id,
                username,
                display_name,
                headline,
                avatar_url
            ),
            institution:institution_id (
                name,
                slug,
                short_name
            )
        `)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(20);

    // Fetch institutions for discovery
    const { data: institutions } = await supabase
        .from("institutions")
        .select("id, name, slug, short_name, logo_url, cover_url, description, city, state")
        .eq("is_active", true)
        .limit(5);

    return (
        <FeedContent
            initialPosts={posts || []}
            institutions={institutions || []}
            user={user}
        />
    );
}
