"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdaptiveLogo } from "@/components/shared/adaptive-logo";
import { resetPassword } from "../actions";

export default function ResetPasswordPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [password, setPassword] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const passwordsMatch = password === confirmPassword;
    const canSubmit = password.length >= 6 && passwordsMatch;

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".auth-glow", { opacity: 0, scale: 0.8, duration: 1.2, ease: "power3.out" });
            gsap.from(".auth-card", { y: 40, opacity: 0, duration: 0.7, delay: 0.2, ease: "power3.out" });
            gsap.from(".auth-logo", { y: -20, opacity: 0, duration: 0.5, delay: 0.3, ease: "back.out(1.7)" });
            gsap.from(".auth-title", { y: 15, opacity: 0, duration: 0.5, delay: 0.4 });
            gsap.from(".auth-field", { y: 12, opacity: 0, stagger: 0.08, duration: 0.4, delay: 0.5 });
            gsap.from(".auth-submit", { y: 10, opacity: 0, duration: 0.4, delay: 0.6 });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!canSubmit) return;
        setError(null);
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const result = await resetPassword(formData);
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
            <div className="auth-glow absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/12 blur-[120px]" />

            <div className="auth-card relative z-10 w-full max-w-md rounded-2xl border border-border/40 bg-card/80 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl sm:p-10">
                {/* Logo */}
                <div className="auth-logo mb-6 text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-lg glow-sm">
                        <AdaptiveLogo size={40} />
                    </div>
                </div>

                {/* Title */}
                <div className="auth-title mb-6 text-center">
                    <h1 className="text-2xl font-bold tracking-tight">Create new password</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Your new password must be different from previous used passwords.</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="auth-field space-y-2">
                        <Label htmlFor="password" className="text-xs font-medium">New Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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

                    <div className="auth-field space-y-2">
                        <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirm New Password</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="rounded-xl pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {confirmPassword && !passwordsMatch && (
                            <p className="text-xs text-destructive ml-1">Passwords do not match.</p>
                        )}
                    </div>

                    {error && (
                        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs text-destructive">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading || !canSubmit}
                        className="auth-submit w-full gap-2 rounded-xl py-5 font-semibold shadow-lg shadow-primary/20"
                        size="lg"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Reset Password
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}

