"use client";

import { useState, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, X, Loader2 } from "lucide-react";
import Image from "next/image";
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

interface MediaFile {
    file: File;
    preview: string;
}

export function CreatePostDialog({ open, onOpenChange, user }: CreatePostDialogProps) {
    const [content, setContent] = useState("");
    const [postType, setPostType] = useState("post");
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Limit to 4 files max
        const remaining = 4 - mediaFiles.length;
        const newFiles = files.slice(0, remaining).map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        setMediaFiles((prev) => [...prev, ...newFiles]);

        // Reset input so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeMedia = (index: number) => {
        setMediaFiles((prev) => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    };

    const handleSubmit = () => {
        if (!content.trim() && mediaFiles.length === 0) return;

        startTransition(async () => {
            const supabase = createClient();
            const uploadedMedia: { url: string; type: string; alt: string }[] = [];

            // Upload media files to Supabase Storage
            for (const { file } of mediaFiles) {
                const ext = file.name.split(".").pop();
                const fileName = `${user.id}/${crypto.randomUUID()}.${ext}`;

                const { data, error: uploadError } = await supabase.storage
                    .from("post-media")
                    .upload(fileName, file, { cacheControl: "3600", upsert: false });

                if (uploadError) {
                    console.error("Upload error:", uploadError);
                    toast({
                        title: "Upload failed",
                        description: `Failed to upload ${file.name}. ${uploadError.message}`,
                        variant: "destructive",
                    });
                    return;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from("post-media")
                    .getPublicUrl(data.path);

                uploadedMedia.push({
                    url: publicUrl,
                    type: file.type.startsWith("video/") ? "video" : "image",
                    alt: file.name,
                });
            }

            const { error } = await supabase.from("posts").insert({
                author_id: user.id,
                content: content.trim(),
                type: postType,
                visibility: "public",
                media: uploadedMedia.length > 0 ? uploadedMedia : [],
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

            // Cleanup
            mediaFiles.forEach((m) => URL.revokeObjectURL(m.preview));
            setContent("");
            setPostType("post");
            setMediaFiles([]);
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

                    {/* Media previews */}
                    <AnimatePresence>
                        {mediaFiles.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex flex-wrap gap-2"
                            >
                                {mediaFiles.map((media, index) => (
                                    <motion.div
                                        key={media.preview}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="relative h-20 w-20 overflow-hidden rounded-lg border border-border"
                                    >
                                        <Image
                                            src={media.preview}
                                            alt={`Upload ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                        <button
                                            onClick={() => removeMedia(index)}
                                            className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-border/50 pt-3">
                        <div className="flex gap-1">
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={mediaFiles.length >= 4}
                            >
                                <ImagePlus className="h-4 w-4" />
                            </Button>
                            {mediaFiles.length > 0 && (
                                <span className="flex items-center text-xs text-muted-foreground">
                                    {mediaFiles.length}/4
                                </span>
                            )}
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={(!content.trim() && mediaFiles.length === 0) || isPending}
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

