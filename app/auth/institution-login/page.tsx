"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Building2, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdaptiveLogo } from "@/components/shared/adaptive-logo";
import { institutionLogin } from "../actions";
import { createClient } from "@/utils/supabase/client";

interface Institution {
    id: string;
    name: string;
    short_name: string | null;
    slug: string;
}

export default function InstitutionLoginPage() {
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [selectedId, setSelectedId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchInstitutions = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from("institutions")
                .select("id, name, short_name, slug")
                .eq("is_active", true)
                .order("name");
            setInstitutions(data || []);
        };
        fetchInstitutions();
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".auth-glow", { opacity: 0, scale: 0.8, duration: 1.2, ease: "power3.out" });
            gsap.from(".auth-card", { y: 40, opacity: 0, duration: 0.7, delay: 0.2, ease: "power3.out" });
            gsap.from(".auth-logo", { y: -20, opacity: 0, duration: 0.5, delay: 0.3, ease: "back.out(1.7)" });
            gsap.from(".auth-title", { y: 15, opacity: 0, duration: 0.5, delay: 0.4 });
            gsap.from(".auth-field", { y: 12, opacity: 0, stagger: 0.08, duration: 0.4, delay: 0.5 });
            gsap.from(".auth-submit", { y: 10, opacity: 0, duration: 0.4, delay: 0.75 });
            gsap.from(".auth-footer", { y: 10, opacity: 0, duration: 0.4, delay: 0.85 });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await institutionLogin(formData);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    return (
        <div ref={containerRef} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-animated" />
            <div className="absolute inset-0 bg-grid" />
            <div className="auth-glow absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/12 blur-[120px]" />
            <div className="absolute right-0 bottom-0 h-[300px] w-[300px] rounded-full bg-emerald-500/8 blur-[100px]" />

            <div className="auth-card relative z-10 w-full max-w-md rounded-2xl border border-border/40 bg-card/80 p-8 shadow-2xl shadow-blue-500/5 backdrop-blur-xl sm:p-10">
                {/* Logo */}
                <div className="auth-logo mb-6 text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 shadow-lg">
                        <Building2 className="h-8 w-8 text-blue-500" />
                    </div>
                </div>

                {/* Title */}
                <div className="auth-title mb-6 text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Institution Login</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Sign in with your institution credentials
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="auth-field space-y-2">
                        <Label htmlFor="institution" className="text-xs font-medium">
                            Institution
                        </Label>
                        <select
                            id="institution"
                            name="institutionId"
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            required
                            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">Select your institution...</option>
                            {institutions.map((inst) => (
                                <option key={inst.id} value={inst.id}>
                                    {inst.short_name || inst.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="auth-field space-y-2">
                        <Label htmlFor="identifier" className="text-xs font-medium">
                            Username / Admission No.
                        </Label>
                        <Input
                            id="identifier"
                            name="identifier"
                            placeholder="e.g. STU2024001"
                            required
                            className="rounded-xl"
                        />
                    </div>

                    <div className="auth-field space-y-2">
                        <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                className="rounded-xl pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs text-destructive">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="auth-submit w-full gap-2 rounded-xl py-5 font-semibold shadow-lg shadow-primary/20"
                        size="lg"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Sign In
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>

                {/* Footer */}
                <div className="auth-footer mt-6 space-y-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <AdaptiveLogo size={16} />
                        <span className="text-xs text-muted-foreground">Powered by Arivolam</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Looking for personal login?{" "}
                        <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
