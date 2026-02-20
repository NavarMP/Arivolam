import { createClient } from "@/utils/supabase/server";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { FeedHeader } from "@/components/feed/feed-header";
import { AIChatWidget } from "@/components/ai/chat-widget";

export default async function FeedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="relative min-h-screen bg-feed-bg">
            {/* Desktop: Premium floating glassmorphism top bar */}
            <DesktopNav user={user} />

            {/* Mobile: Compact top header */}
            <div className="md:hidden">
                <FeedHeader user={user} />
            </div>

            {/* Main content — different top padding for desktop (floating nav) vs mobile */}
            <main className="container mx-auto max-w-2xl px-4 pb-28 pt-20 md:pt-24">
                {children}
            </main>

            {/* Mobile: Floating dock navigation */}
            <MobileNav user={user} />

            <AIChatWidget />
        </div>
    );
}

