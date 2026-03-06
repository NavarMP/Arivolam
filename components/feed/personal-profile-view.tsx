"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    MapPin,
    Link as LinkIcon,
    Calendar,
    Building2,
    ArrowLeft,
    Users,
    Settings,
    UserPlus,
    UserCheck,
    GraduationCap,
    Briefcase,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePost } from "@/app/profile/post-actions";
import { toast } from "sonner";

interface ProfileViewProps {
    profile: any;
    posts: any[];
    memberships?: any[];
    isOwnProfile: boolean;
    currentUser: any;
    isFollowing: boolean;
}

export function PersonalProfileView({ profile, posts, memberships, isOwnProfile, currentUser, isFollowing }: ProfileViewProps) {
    const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");

    const subTypeLabels: Record<string, string> = {
        student: "Student",
        professor: "Professor",
        researcher: "Researcher",
        visitor: "Visitor",
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

                {/* Edit/Settings button for own profile */}
                {isOwnProfile && (
                    <div className="absolute right-4 top-4">
                        <Link href="/settings/profile">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full bg-background/60 backdrop-blur-sm"
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Profile info */}
            <div className="container mx-auto max-w-2xl px-4">
                {/* Avatar */}
                <div className="relative -mt-16 mb-4 flex items-end justify-between sm:-mt-20">
                    <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-background bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-3xl font-bold shadow-xl sm:h-36 sm:w-36 overflow-hidden">
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt={profile.display_name || "Avatar"}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            profile.display_name?.charAt(0).toUpperCase() || "U"
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pb-2">
                        {isOwnProfile ? (
                            <Link href="/settings/profile">
                                <Button variant="outline" size="sm" className="rounded-full gap-2 text-xs">
                                    <Settings className="h-3.5 w-3.5" />
                                    Edit Profile
                                </Button>
                            </Link>
                        ) : currentUser ? (
                            <Button
                                variant={isFollowing ? "outline" : "default"}
                                size="sm"
                                className="rounded-full gap-2 text-xs"
                            >
                                {isFollowing ? (
                                    <>
                                        <UserCheck className="h-3.5 w-3.5" />
                                        Following
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-3.5 w-3.5" />
                                        Follow
                                    </>
                                )}
                            </Button>
                        ) : null}
                    </div>
                </div>

                {/* Name + meta */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold sm:text-3xl">
                            {profile.display_name || profile.username || "User"}
                        </h1>
                        {profile.is_verified && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                                ✓
                            </div>
                        )}
                    </div>

                    {profile.username && (
                        <p className="text-sm text-muted-foreground">
                            @{profile.username}
                            {profile.sub_type && (
                                <span className="ml-2 text-muted-foreground/60">
                                    · {subTypeLabels[profile.sub_type] || profile.sub_type}
                                </span>
                            )}
                        </p>
                    )}

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
                                {(() => {
                                    try { return new URL(profile.website).hostname; }
                                    catch { return profile.website; }
                                })()}
                            </a>
                        )}
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                        </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 pt-1 text-sm">
                        <span>
                            <strong>{profile.posts_count || 0}</strong>{" "}
                            <span className="text-muted-foreground">Posts</span>
                        </span>
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

                {/* Tabs */}
                <div className="mt-6 border-b border-border/50">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setActiveTab("posts")}
                            className={`pb-3 text-sm font-medium transition-colors ${activeTab === "posts"
                                ? "border-b-2 border-primary text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Posts
                        </button>
                        <button
                            onClick={() => setActiveTab("about")}
                            className={`pb-3 text-sm font-medium transition-colors ${activeTab === "about"
                                ? "border-b-2 border-primary text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            About & Skills
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {activeTab === "posts" && (
                        <div className="space-y-4">
                            {posts && posts.length > 0 ? (
                                posts.map((post) => (
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
                                                            className="rounded-lg object-cover h-32 w-full border border-border/50"
                                                        />
                                                    )
                                                )}
                                            </div>
                                        )}
                                        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/10 pt-3">
                                            <div className="flex gap-3">
                                                <time>
                                                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                                </time>
                                                {post.reactions_count > 0 && <span>• {post.reactions_count} reactions</span>}
                                                {post.comments_count > 0 && <span>• {post.comments_count} comments</span>}
                                            </div>
                                            {isOwnProfile && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 px-2 text-destructive hover:bg-destructive/10"
                                                    onClick={async () => {
                                                        if (confirm("Are you sure you want to delete this post?")) {
                                                            const res = await deletePost(post.id);
                                                            if (res.error) toast.error(res.error);
                                                            else toast.success("Post deleted");
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                                                </Button>
                                            )}
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/50">
                                    <Users className="h-8 w-8 text-muted-foreground/50" />
                                    <p className="text-sm">
                                        {isOwnProfile
                                            ? "You haven't posted yet. Share something with the world!"
                                            : "No public posts yet"}
                                    </p>
                                    {isOwnProfile && (
                                        <Link href="/create">
                                            <Button size="sm" className="mt-2 rounded-full">
                                                Create your first post
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "about" && (
                        <div className="space-y-6">
                            {/* Institution memberships */}
                            {memberships && memberships.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-muted-foreground tracking-wider flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        AFFILIATIONS
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {memberships.map((m, i) => {
                                            const inst = m.institutions as any;
                                            return (
                                                <Link
                                                    key={i}
                                                    href={`/campus/${inst.slug}`}
                                                    className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-3 py-2 text-sm transition-colors hover:border-primary/50"
                                                >
                                                    <Building2 className="h-4 w-4 text-primary" />
                                                    <span className="font-medium">{inst.short_name || inst.name}</span>
                                                    <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-0.5 rounded-full">
                                                        {m.role}
                                                    </span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Skills */}
                            {profile.skills && profile.skills.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-muted-foreground tracking-wider flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        SKILLS
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {(profile.skills as string[]).map((skill: string) => (
                                            <span
                                                key={skill}
                                                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* If no about info exist */}
                            {(!memberships || memberships.length === 0) && (!profile.skills || profile.skills.length === 0) && (
                                <div className="text-center py-8 text-sm text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/50">
                                    No detailed information provided yet.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Bottom padding */}
                <div className="h-20" />
            </div>
        </div>
    );
}
