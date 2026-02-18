"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface CreatePostDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: SupabaseUser;
}

export function CreatePostDialog({ open, onOpenChange, user }: CreatePostDialogProps) {
    const [content, setContent] = useState("");
    const [postType, setPostType] = useState("post");
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSubmit = () => {
        if (!content.trim()) return;

        startTransition(async () => {
            const supabase = createClient();

            const { error } = await supabase.from("posts").insert({
                author_id: user.id,
                content: content.trim(),
                type: postType,
                visibility: "public",
            });

            if (error) {
                toast({
                    title: "Error",
                    description: "Failed to create post. Please try again.",
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Post published!",
                description: "Your post is now live.",
            });

            setContent("");
            setPostType("post");
            onOpenChange(false);

            // Refresh feed
            window.location.reload();
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-lg">Create a Post</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Author info */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                            <p className="text-sm font-semibold">
                                {user.user_metadata?.full_name || user.email?.split("@")[0]}
                            </p>
                            <Select value={postType} onValueChange={setPostType}>
                                <SelectTrigger className="h-7 w-auto gap-1 border-0 p-0 text-xs text-muted-foreground hover:text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="post">Post</SelectItem>
                                    <SelectItem value="article">Article</SelectItem>
                                    <SelectItem value="project">Project Showcase</SelectItem>
                                    <SelectItem value="event">Event</SelectItem>
                                    <SelectItem value="announcement">Announcement</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Content textarea */}
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What do you want to share?"
                        className="min-h-[120px] resize-none border-0 p-0 text-sm shadow-none focus-visible:ring-0"
                    />

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-border/50 pt-3">
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground">
                                <ImagePlus className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={!content.trim() || isPending}
                            className="rounded-full px-6 text-sm font-semibold"
                            size="sm"
                        >
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Post"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
