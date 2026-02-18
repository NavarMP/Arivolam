"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Building2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard, PostData } from "@/components/feed/post-card";
import { CreatePostDialog } from "@/components/feed/create-post-dialog";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface InstitutionPreview {
    id: string;
    name: string;
    slug: string;
    short_name: string | null;
    logo_url: string | null;
    cover_url: string | null;
    description: string | null;
    city: string | null;
    state: string | null;
}

interface FeedContentProps {
    initialPosts: PostData[];
    institutions: InstitutionPreview[];
    user: SupabaseUser | null;
}

export function FeedContent({ initialPosts, institutions, user }: FeedContentProps) {
    const [posts] = useState<PostData[]>(initialPosts);
    const [showCreatePost, setShowCreatePost] = useState(false);

    return (
        <div className="space-y-4">
            {/* Welcome / Create post prompt */}
            {user ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <button
                            onClick={() => setShowCreatePost(true)}
                            className="flex-1 rounded-full border border-border bg-muted/50 px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted"
                        >
                            Share an update...
                        </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 gap-2 text-xs text-muted-foreground"
                            onClick={() => setShowCreatePost(true)}
                        >
                            <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                            Article
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 gap-2 text-xs text-muted-foreground"
                            onClick={() => setShowCreatePost(true)}
                        >
                            <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                            Project
                        </Button>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-6 shadow-sm"
                >
                    <h2 className="text-xl font-bold tracking-tight">
                        Welcome to <span className="text-primary">Arivolam</span>
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        The horizon of learning — discover campus life, connect with peers, and explore.
                    </p>
                    <div className="mt-4 flex gap-2">
                        <Link href="/auth/signup">
                            <Button size="sm" className="rounded-full text-xs font-semibold">
                                Join Now
                            </Button>
                        </Link>
                        <Link href="/auth/login">
                            <Button variant="outline" size="sm" className="rounded-full text-xs">
                                Sign In
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* Institution discovery cards */}
            {institutions.length > 0 && (
                <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        Discover Institutions
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {institutions.map((inst, i) => (
                            <motion.div
                                key={inst.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Link href={`/campus/${inst.slug}`}>
                                    <div className="group w-[200px] shrink-0 overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:shadow-md hover:border-primary/30">
                                        <div className="h-20 bg-gradient-to-r from-primary/20 to-blue-500/20" />
                                        <div className="p-3 -mt-5">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border shadow-sm text-sm font-bold text-primary">
                                                {inst.short_name?.charAt(0) || inst.name.charAt(0)}
                                            </div>
                                            <h4 className="mt-2 text-sm font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-1">
                                                {inst.short_name || inst.name}
                                            </h4>
                                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                                                {inst.city}{inst.state ? `, ${inst.state}` : ""}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Posts feed */}
            <div className="space-y-4">
                {posts.length > 0 ? (
                    posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center"
                    >
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">No posts yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                            Be the first to share something with the community. Your campus is waiting to hear from you!
                        </p>
                        {user && (
                            <Button
                                onClick={() => setShowCreatePost(true)}
                                className="mt-4 rounded-full"
                                size="sm"
                            >
                                Create your first post
                            </Button>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Create Post Dialog */}
            {user && (
                <CreatePostDialog
                    open={showCreatePost}
                    onOpenChange={setShowCreatePost}
                    user={user}
                />
            )}
        </div>
    );
}
