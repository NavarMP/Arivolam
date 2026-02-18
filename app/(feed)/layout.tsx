import { createClient } from "@/utils/supabase/server";
import { FeedHeader } from "@/components/feed/feed-header";
import { BottomNav } from "@/components/feed/bottom-nav";

export default async function FeedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="relative min-h-screen bg-feed-bg">
            <FeedHeader user={user} />
            <main className="container mx-auto max-w-2xl px-4 pb-24 pt-20">
                {children}
            </main>
            <BottomNav user={user} />
        </div>
    );
}
