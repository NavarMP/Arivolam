import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    MapPin,
    Link as LinkIcon,
    Calendar,
    GraduationCap,
    Building2,
    ArrowLeft,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
    params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
    const { username } = await params;
    const supabase = await createClient();

    // Fetch profile by username
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
            created_at
        `)
        .eq("username", username)
        .eq("is_public", true)
        .single();

    if (!profile) notFound();

    // Fetch user's recent posts
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

    // Get institution memberships
    const { data: memberships } = await supabase
        .from("institution_members")
        .select(`
            role,
            institutions:institution_id (name, slug, short_name)
        `)
        .eq("user_id", profile.id)
        .eq("is_active", true);

    const subTypeLabels: Record<string, string> = {
        student: "Student",
        professor: "Professor",
        researcher: "Researcher",
        alumni: "Alumni",
        visitor: "Visitor",
        parent: "Parent",
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Cover image */}
            <div className="relative h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-background sm:h-64">
                {profile.cover_url && (
                    <img
                        src={profile.cover_url}
                        alt="Cover"
                        className="h-full w-full object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

                {/* Back button */}
                <div className="absolute left-4 top-4">
                    <Link href="/">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full bg-background/60 backdrop-blur-sm"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Profile info */}
            <div className="container mx-auto max-w-2xl px-4">
                {/* Avatar */}
                <div className="relative -mt-16 mb-4 flex items-end gap-4 sm:-mt-20">
                    <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-background bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-3xl font-bold shadow-xl sm:h-36 sm:w-36">
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt={profile.display_name || "Avatar"}
                                className="h-full w-full rounded-xl object-cover"
                            />
                        ) : (
                            profile.display_name?.charAt(0).toUpperCase() || "U"
                        )}
                    </div>
                </div>

                {/* Name + meta */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold sm:text-3xl">
                            {profile.display_name || profile.username}
                        </h1>
                        {profile.is_verified && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                                ✓
                            </div>
                        )}
                        {profile.profile_type === "institution" && (
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                                Institution
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                        @{profile.username}
                        {profile.sub_type && (
                            <span className="ml-2 text-muted-foreground/60">
                                · {subTypeLabels[profile.sub_type] || profile.sub_type}
                            </span>
                        )}
                    </p>

                    {profile.headline && (
                        <p className="text-sm font-medium">{profile.headline}</p>
                    )}

                    {profile.bio && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {profile.bio}
                        </p>
                    )}

                    {/* Meta info row */}
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-sm text-muted-foreground">
                        {profile.location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {profile.location}
                            </span>
                        )}
                        {profile.website && (
                            <a
                                href={profile.website}
                                target="_blank"
                                rel="noopener"
                                className="flex items-center gap-1 text-primary hover:underline"
                            >
                                <LinkIcon className="h-3.5 w-3.5" />
                                {new URL(profile.website).hostname}
                            </a>
                        )}
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                        </span>
                    </div>

                    {/* Follow counts */}
                    <div className="flex items-center gap-4 pt-1 text-sm">
                        <span>
                            <strong>{profile.following_count || 0}</strong>{" "}
                            <span className="text-muted-foreground">Following</span>
                        </span>
                        <span>
                            <strong>{profile.followers_count || 0}</strong>{" "}
                            <span className="text-muted-foreground">Followers</span>
                        </span>
                    </div>
                </div>

                {/* Institution memberships */}
                {memberships && memberships.length > 0 && (
                    <div className="mt-6 space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Affiliations
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {memberships.map((m, i) => {
                                const inst = m.institutions as unknown as {
                                    name: string;
                                    slug: string;
                                    short_name: string | null;
                                };
                                return (
                                    <Link
                                        key={i}
                                        href={`/campus/${inst.slug}`}
                                        className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-3 py-2 text-sm transition-colors hover:bg-muted"
                                    >
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        <span>{inst.short_name || inst.name}</span>
                                        <span className="text-xs text-muted-foreground capitalize">
                                            ({m.role})
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Skills */}
                {profile.skills && profile.skills.length > 0 && (
                    <div className="mt-6 space-y-2">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill: string) => (
                                <span
                                    key={skill}
                                    className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Posts */}
                <div className="mt-8 border-t border-border/50 pt-6">
                    <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Recent Activity
                    </h3>
                    {posts && posts.length > 0 ? (
                        <div className="space-y-4">
                            {posts.map((post) => (
                                <article
                                    key={post.id}
                                    className="rounded-xl border border-border/50 bg-card p-4 transition-shadow hover:shadow-sm"
                                >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {post.content}
                                    </p>
                                    {post.media && Array.isArray(post.media) && post.media.length > 0 && (
                                        <div className="mt-3 grid gap-1 grid-cols-2">
                                            {(post.media as { url: string; type: string }[]).slice(0, 4).map(
                                                (m, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={m.url}
                                                        alt="Post media"
                                                        className="rounded-lg object-cover h-32 w-full"
                                                    />
                                                )
                                            )}
                                        </div>
                                    )}
                                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                        <time>
                                            {formatDistanceToNow(new Date(post.created_at), {
                                                addSuffix: true,
                                            })}
                                        </time>
                                        {post.reactions_count > 0 && (
                                            <span>{post.reactions_count} reactions</span>
                                        )}
                                        {post.comments_count > 0 && (
                                            <span>{post.comments_count} comments</span>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                            <Users className="h-8 w-8" />
                            <p className="text-sm">No public posts yet</p>
                        </div>
                    )}
                </div>

                {/* Bottom padding */}
                <div className="h-16" />
            </div>
        </div>
    );
}
