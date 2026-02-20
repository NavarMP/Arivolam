"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Send,
    Mail,
    MapPin,
    MessageSquare,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdaptiveLogo } from "@/components/shared/adaptive-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        startTransition(async () => {
            // Simulate form submission
            await new Promise((r) => setTimeout(r, 1000));
            toast({
                title: "Message sent! ✉️",
                description: "We'll get back to you as soon as possible.",
            });
            (e.target as HTMLFormElement).reset();
        });
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Nav */}
            <div className="fixed left-4 right-4 top-4 z-50 flex items-center justify-between md:left-8 md:right-8">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 rounded-xl bg-background/60 backdrop-blur-xl">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </Link>
                <ThemeToggle />
            </div>

            <div className="container mx-auto max-w-4xl px-4 pb-16 pt-24">
                {/* Header */}
                <div className="mb-12 text-center">
                    <AdaptiveLogo size={48} className="mx-auto mb-4" />
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Get in Touch</h1>
                    <p className="mt-2 text-muted-foreground">
                        Have questions, feedback, or ideas? We&apos;d love to hear from you.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-5">
                    {/* Contact info cards */}
                    <div className="space-y-4 lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="rounded-2xl border border-border/40 bg-card p-6"
                        >
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                <Mail className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="text-sm font-bold">Email</h3>
                            <a href="mailto:hello@arivolam.com" className="text-sm text-primary hover:underline">
                                hello@arivolam.com
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-2xl border border-border/40 bg-card p-6"
                        >
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                                <MapPin className="h-5 w-5 text-emerald-500" />
                            </div>
                            <h3 className="text-sm font-bold">Location</h3>
                            <p className="text-sm text-muted-foreground">
                                Kerala, India 🇮🇳
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="rounded-2xl border border-border/40 bg-card p-6"
                        >
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                                <MessageSquare className="h-5 w-5 text-violet-500" />
                            </div>
                            <h3 className="text-sm font-bold">Response Time</h3>
                            <p className="text-sm text-muted-foreground">
                                Usually within 24 hours
                            </p>
                        </motion.div>
                    </div>

                    {/* Contact form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="lg:col-span-3"
                    >
                        <form
                            onSubmit={handleSubmit}
                            className="rounded-2xl border border-border/40 bg-card p-6 sm:p-8"
                        >
                            <h2 className="mb-6 text-lg font-bold">Send a Message</h2>

                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input id="name" name="name" placeholder="Your name" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input id="subject" name="subject" placeholder="What's this about?" required />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        placeholder="Tell us more..."
                                        rows={5}
                                        className="resize-none"
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full gap-2 rounded-xl font-semibold"
                                    size="lg"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            Send Message
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
