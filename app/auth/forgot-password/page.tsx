"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Loader2, ArrowRight, ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdaptiveLogo } from "@/components/shared/adaptive-logo";
import { forgotPassword } from "../actions";

export default function ForgotPasswordPage() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".auth-glow", { opacity: 0, scale: 0.8, duration: 1.2, ease: "power3.out" });
            gsap.from(".auth-card", { y: 40, opacity: 0, duration: 0.7, delay: 0.2, ease: "power3.out" });
            gsap.from(".auth-logo", { y: -20, opacity: 0, duration: 0.5, delay: 0.3, ease: "back.out(1.7)" });
            gsap.from(".auth-title", { y: 15, opacity: 0, duration: 0.5, delay: 0.4 });
            gsap.from(".auth-field", { y: 12, opacity: 0, stagger: 0.08, duration: 0.4, delay: 0.5 });
            gsap.from(".auth-submit", { y: 10, opacity: 0, duration: 0.4, delay: 0.6 });
            gsap.from(".auth-footer", { y: 10, opacity: 0, duration: 0.4, delay: 0.7 });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await forgotPassword(formData);
        if (result?.error) {
            setError(result.error);
        } else if (result?.success) {
            setSuccess(true);
        }
        setLoading(false);
    }

    return (
        <div ref={containerRef} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-animated" />
            <div className="absolute inset-0 bg-grid" />
            <div className="auth-glow absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/12 blur-[120px]" />
            <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-green-500/8 blur-[100px]" />

            <div className="auth-card relative z-10 w-full max-w-md rounded-2xl border border-border/40 bg-card/80 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl sm:p-10">
                {/* Logo */}
                <div className="auth-logo mb-6 text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-lg glow-sm">
                        <AdaptiveLogo size={40} />
                    </div>
                </div>

                {success ? (
                    <div className="text-center space-y-6">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                            <MailCheck className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight mb-2">Check your inbox</h2>
                            <p className="text-sm text-muted-foreground">
                                We&apos;ve sent a password reset link to your email address. Please check your spam folder if you don&apos;t see it.
                            </p>
                        </div>
                        <Button asChild className="w-full gap-2 rounded-xl py-5 font-semibold" size="lg">
                            <Link href="/auth/login">
                                <ArrowLeft className="h-4 w-4" />
                                Return to login
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Title */}
                        <div className="auth-title mb-6 text-center">
                            <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
                            <p className="mt-1 text-sm text-muted-foreground">No worries, we&apos;ll send you reset instructions.</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="auth-field space-y-2">
                                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    className="rounded-xl"
                                />
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
                                        Send Reset Link
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Footer */}
                        <div className="auth-footer mt-6 text-center">
                            <Link
                                href="/auth/login"
                                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to login
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
