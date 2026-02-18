"use client";

import * as React from "react";
import { useRef, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ArrowRight, MoveLeft, Building2, KeyRound, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { institutionLogin } from "@/app/auth/actions";
import { createClient } from "@/utils/supabase/client";

interface Institution {
    id: string;
    name: string;
    slug: string;
    short_name: string | null;
    logo_url: string | null;
}

export default function InstitutionLoginPage() {
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [selectedInstitution, setSelectedInstitution] = useState<string>("");
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch institutions
    useEffect(() => {
        const fetchInstitutions = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from("institutions")
                .select("id, name, slug, short_name, logo_url")
                .eq("is_active", true)
                .order("name");

            setInstitutions(data || []);
            setLoading(false);
        };
        fetchInstitutions();
    }, []);

    // GSAP entrance animation
    useEffect(() => {
        if (!containerRef.current || loading) return;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            tl.from(".inst-icon", { y: -30, opacity: 0, duration: 0.6 })
                .from(".inst-title", { y: 20, opacity: 0, duration: 0.5 }, "-=0.3")
                .from(".inst-subtitle", { y: 20, opacity: 0, duration: 0.5 }, "-=0.3")
                .from(".inst-select", { y: 15, opacity: 0, duration: 0.4 }, "-=0.2")
                .from(".inst-input", { y: 15, opacity: 0, stagger: 0.1, duration: 0.4 }, "-=0.2")
                .from(".inst-submit", { y: 10, opacity: 0, duration: 0.4 }, "-=0.2");
        }, containerRef);

        return () => ctx.revert();
    }, [loading]);

    const handleSubmit = async (formData: FormData) => {
        setError(null);
        formData.set("institutionId", selectedInstitution);

        startTransition(async () => {
            const result = await institutionLogin(formData);
            if (result?.error) {
                setError(result.error);
            }
        });
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4 md:p-8">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/15 opacity-50 blur-[120px]" />
                <div className="absolute right-0 top-0 h-[300px] w-[300px] bg-primary/10 opacity-30 blur-[100px]" />
                <div className="absolute bottom-0 left-0 h-[300px] w-[300px] bg-teal-500/10 opacity-30 blur-[100px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>

            {/* Back button */}
            <div className="absolute left-4 top-4 z-20 md:left-8 md:top-8">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                        <MoveLeft className="h-4 w-4" />
                        Back to Feed
                    </Button>
                </Link>
            </div>

            {/* Main card */}
            <div ref={containerRef} className="z-10 w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-2xl shadow-blue-500/5 backdrop-blur-xl"
                >
                    {/* Icon & Title */}
                    <div className="mb-8 text-center">
                        <div className="inst-icon mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 shadow-lg shadow-blue-500/10">
                            <Building2 className="h-7 w-7 text-blue-500" />
                        </div>
                        <h1 className="inst-title text-2xl font-bold tracking-tight">Enter Your Campus</h1>
                        <p className="inst-subtitle mt-2 text-sm text-muted-foreground">
                            Sign in with your institution credentials
                        </p>
                    </div>

                    <form action={handleSubmit} className="space-y-4">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Institution selector */}
                        <div className="inst-select space-y-2">
                            <Label className="text-sm font-medium">Select Institution</Label>
                            {loading ? (
                                <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                            ) : (
                                <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Choose your institution..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {institutions.map((inst) => (
                                            <SelectItem key={inst.id} value={inst.id}>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    <span>{inst.short_name || inst.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Identifier */}
                        <div className="inst-input space-y-2">
                            <Label htmlFor="identifier" className="text-sm font-medium">
                                Register No / Admission No / Username
                            </Label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="identifier"
                                    name="identifier"
                                    type="text"
                                    placeholder="Enter your ID"
                                    required
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="inst-input space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="inst-submit w-full rounded-xl text-base font-semibold"
                            size="lg"
                            disabled={!selectedInstitution || isPending}
                        >
                            {isPending ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                    Entering campus...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Enter Campus
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">
                        <p>
                            Don&apos;t have an Arivolam account?{" "}
                            <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
                                Sign up first
                            </Link>
                        </p>
                        <p className="text-xs">
                            Contact your institution&apos;s admin if you don&apos;t have credentials.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
