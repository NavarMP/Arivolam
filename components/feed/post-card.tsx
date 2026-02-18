"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
    MessageCircle,
    Share2,
    Bookmark,
    BookmarkCheck,
    MoreHorizontal,
    ThumbsUp,
    Heart,
    PartyPopper,
    Lightbulb,
    HandHeart,
    Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export interface PostData {
    id: string;
    content: string;
    media: { url: string; type: string; alt?: string }[];
    type: string;
    reactions_count: number;
    comments_count: number;
    shares_count: number;
    saves_count: number;
    created_at: string;
    author: {
        id: string;
        username: string;
        display_name: string;
        headline?: string;
        avatar_url?: string;
    };
    institution?: {
        name: string;
        slug: string;
        short_name?: string;
    };
    user_reaction?: string | null;
    is_saved?: boolean;
}

const reactions = [
    { type: "like", icon: ThumbsUp, label: "Like", color: "text-blue-500" },
    { type: "celebrate", icon: PartyPopper, label: "Celebrate", color: "text-yellow-500" },
    { type: "love", icon: Heart, label: "Love", color: "text-rose-500" },
    { type: "insightful", icon: Lightbulb, label: "Insightful", color: "text-purple-500" },
    { type: "support", icon: HandHeart, label: "Support", color: "text-emerald-500" },
];

interface PostCardProps {
    post: PostData;
    onReact?: (postId: string, type: string) => void;
    onSave?: (postId: string) => void;
}

export function PostCard({ post, onReact, onSave }: PostCardProps) {
    const [showReactions, setShowReactions] = useState(false);
    const [currentReaction, setCurrentReaction] = useState(post.user_reaction);
    const [isSaved, setIsSaved] = useState(post.is_saved || false);
    const [reactionsCount, setReactionsCount] = useState(post.reactions_count);

    const handleReaction = (type: string) => {
        if (currentReaction === type) {
            setCurrentReaction(null);
            setReactionsCount((prev) => prev - 1);
        } else {
            if (!currentReaction) setReactionsCount((prev) => prev + 1);
            setCurrentReaction(type);
        }
        setShowReactions(false);
        onReact?.(post.id, type);
    };

    const handleSave = () => {
        setIsSaved(!isSaved);
        onSave?.(post.id);
    };

    const selectedReaction = reactions.find((r) => r.type === currentReaction);

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-shadow hover:shadow-md"
        >
            {/* Author header */}
            <div className="flex items-start gap-3 p-4 pb-2">
                <Link href={`/profile/${post.author.username || post.author.id}`}>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm ring-2 ring-background">
                        {post.author.avatar_url ? (
                            <img
                                src={post.author.avatar_url}
                                alt={post.author.display_name}
                                className="h-full w-full rounded-full object-cover"
                            />
                        ) : (
                            post.author.display_name?.charAt(0).toUpperCase() || "U"
                        )}
                    </div>
                </Link>

                <div className="flex-1 min-w-0">
                    <Link
                        href={`/profile/${post.author.username || post.author.id}`}
                        className="group"
                    >
                        <p className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
                            {post.author.display_name}
                        </p>
                    </Link>
                    {post.author.headline && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {post.author.headline}
                        </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <time>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</time>
                        {post.institution && (
                            <>
                                <span>·</span>
                                <Link
                                    href={`/campus/${post.institution.slug}`}
                                    className="hover:text-primary transition-colors"
                                >
                                    {post.institution.short_name || post.institution.name}
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Media */}
            {post.media && post.media.length > 0 && (
                <div className={`grid ${post.media.length > 1 ? "grid-cols-2" : "grid-cols-1"} gap-0.5`}>
                    {post.media.slice(0, 4).map((item, index) => (
                        <div key={index} className="relative">
                            <AspectRatio ratio={post.media.length === 1 ? 16 / 9 : 1}>
                                {item.type === "video" ? (
                                    <video
                                        src={item.url}
                                        className="h-full w-full object-cover"
                                        controls
                                    />
                                ) : (
                                    <img
                                        src={item.url}
                                        alt={item.alt || "Post media"}
                                        className="h-full w-full object-cover"
                                    />
                                )}
                            </AspectRatio>
                            {index === 3 && post.media.length > 4 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-lg font-bold">
                                    +{post.media.length - 4}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Engagement stats */}
            {(reactionsCount > 0 || post.comments_count > 0) && (
                <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        {reactionsCount > 0 && (
                            <>
                                <div className="flex -space-x-1">
                                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[8px] text-white">👍</div>
                                    {reactionsCount > 5 && (
                                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] text-white">❤️</div>
                                    )}
                                </div>
                                <span className="ml-1">{reactionsCount}</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {post.comments_count > 0 && (
                            <span>{post.comments_count} {post.comments_count === 1 ? "comment" : "comments"}</span>
                        )}
                        {post.shares_count > 0 && <span>{post.shares_count} shares</span>}
                    </div>
                </div>
            )}

            {/* Action bar */}
            <div className="relative flex items-center border-t border-border/50 px-1">
                {/* Reaction button with popup */}
                <div
                    className="relative flex-1"
                    onMouseEnter={() => setShowReactions(true)}
                    onMouseLeave={() => setShowReactions(false)}
                >
                    <Button
                        variant="ghost"
                        className={`w-full gap-2 text-xs font-medium rounded-none h-10 ${currentReaction ? selectedReaction?.color : "text-muted-foreground"
                            }`}
                        onClick={() => handleReaction(currentReaction || "like")}
                    >
                        {selectedReaction ? (
                            <selectedReaction.icon className="h-4 w-4" />
                        ) : (
                            <ThumbsUp className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">{selectedReaction?.label || "Like"}</span>
                    </Button>

                    {/* Reaction picker popup */}
                    <AnimatePresence>
                        {showReactions && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                transition={{ duration: 0.15 }}
                                className="absolute -top-12 left-0 z-10 flex gap-1 rounded-full border border-border bg-card p-1.5 shadow-lg"
                            >
                                {reactions.map((reaction) => (
                                    <motion.button
                                        key={reaction.type}
                                        onClick={() => handleReaction(reaction.type)}
                                        whileHover={{ scale: 1.3, y: -4 }}
                                        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muted ${reaction.color}`}
                                        title={reaction.label}
                                    >
                                        <reaction.icon className="h-4 w-4" />
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <Button
                    variant="ghost"
                    className="flex-1 gap-2 text-xs font-medium text-muted-foreground rounded-none h-10"
                >
                    <MessageCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Comment</span>
                </Button>

                <Button
                    variant="ghost"
                    className="flex-1 gap-2 text-xs font-medium text-muted-foreground rounded-none h-10"
                >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className={`h-10 w-10 rounded-none ${isSaved ? "text-primary" : "text-muted-foreground"}`}
                    onClick={handleSave}
                >
                    {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                </Button>
            </div>
        </motion.article>
    );
}
