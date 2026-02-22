"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ImagePlus,
    X,
    Loader2,
    ArrowLeft,
    Globe,
    Building2,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

interface CreatePostPageProps {
    user: SupabaseUser;
}

interface MediaFile {
    file: File;
    preview: string;
}

export function CreatePostPage({ user }: CreatePostPageProps) {
    const [content, setContent] = useState("");
    const [postType, setPostType] = useState("post");
    const [visibility, setVisibility] = useState("public");
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const router = useRouter();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const remaining = 4 - mediaFiles.length;
        const newFiles = files.slice(0, remaining).map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        setMediaFiles((prev) => [...prev, ...newFiles]);
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

            for (const { file } of mediaFiles) {
                const ext = file.name.split(".").pop();
                const fileName = `${user.id}/${crypto.randomUUID()}.${ext}`;

                const { data, error: uploadError } = await supabase.storage
                    .from("post-media")
                    .upload(fileName, file, { cacheControl: "3600", upsert: false });

                if (uploadError) {
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
                visibility,
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
                title: "Post published! 🎉",
                description: "Your post is now live on the feed.",
            });

            mediaFiles.forEach((m) => URL.revokeObjectURL(m.preview));
            router.push("/");
        });
    };

    const visibilityOptions = [
        { value: "public", label: "Public", icon: Globe, desc: "Anyone can see" },
        { value: "institution", label: "Campus", icon: Building2, desc: "Your campus only" },
        { value: "connections", label: "Connections", icon: Users, desc: "Your connections" },
    ];

    const charCount = content.length;
    const maxChars = 3000;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-lg font-semibold">Create Post</h1>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={(!content.trim() && mediaFiles.length === 0) || isPending}
                    className="rounded-full px-6 text-sm font-semibold shadow-sm shadow-primary/20"
                    size="sm"
                >
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        "Post"
                    )}
                </Button>
            </header>

            <main className="container mx-auto max-w-2xl px-4 py-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {/* Author row */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                            {user.user_metadata?.full_name?.charAt(0).toUpperCase() ||
                                user.email?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                            <p className="text-sm font-semibold">
                                {user.user_metadata?.full_name || user.email?.split("@")[0]}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <Select value={postType} onValueChange={setPostType}>
                                    <SelectTrigger className="h-7 w-auto gap-1 border-border/60 px-2.5 text-xs rounded-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="post">Post</SelectItem>
                                        <SelectItem value="article">Article</SelectItem>
                                        <SelectItem value="project">Project</SelectItem>
                                        <SelectItem value="event">Event</SelectItem>
                                        <SelectItem value="announcement">Announcement</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={visibility} onValueChange={setVisibility}>
                                    <SelectTrigger className="h-7 w-auto gap-1 border-border/60 px-2.5 text-xs rounded-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {visibilityOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                <div className="flex items-center gap-2">
                                                    <opt.icon className="h-3 w-3" />
                                                    {opt.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
                            placeholder="What do you want to share with the world?"
                            className="min-h-[200px] resize-none border-0 p-0 text-base shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
                            autoFocus
                        />
                        <div className="mt-2 flex justify-end">
                            <span className={`text-xs ${charCount > maxChars * 0.9 ? "text-destructive" : "text-muted-foreground"}`}>
                                {charCount}/{maxChars}
                            </span>
                        </div>
                    </div>

                    {/* Media preview */}
                    {mediaFiles.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                        >
                            {mediaFiles.map((media, index) => (
                                <div
                                    key={media.preview}
                                    className="relative aspect-square overflow-hidden rounded-xl border border-border"
                                >
                                    <Image
                                        src={media.preview}
                                        alt={`Upload ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        onClick={() => removeMedia(index)}
                                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* Media add button */}
                    <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 rounded-full text-xs"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={mediaFiles.length >= 4}
                        >
                            <ImagePlus className="h-4 w-4" />
                            Add Media
                            {mediaFiles.length > 0 && (
                                <span className="text-muted-foreground">({mediaFiles.length}/4)</span>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
