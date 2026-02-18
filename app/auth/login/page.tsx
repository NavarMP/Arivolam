"use client";

import * as React from "react";
import { Suspense, useRef, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ArrowRight, Mail, Lock, Eye, EyeOff, MoveLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { login, loginWithOAuth } from "@/app/auth/actions";
import { useToast } from "@/hooks/use-toast";

const socialProviders = [
    {
        id: "google" as const,
        label: "Google",
        icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
        ),
    },
    {
        id: "github" as const,
        label: "GitHub",
        icon: (
            <svg className="h-5 w-5 dark:fill-white fill-black" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
        ),
    },
    {
        id: "facebook" as const,
        label: "Facebook",
        icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
            </svg>
        ),
    },
    {
        id: "apple" as const,
        label: "Apple",
        icon: (
            <svg className="h-5 w-5 dark:fill-white fill-black" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
        ),
    },
];

function LoginPageInner() {
    const [showPassword, setShowPassword] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const { toast } = useToast();

    useEffect(() => {
        const errorParam = searchParams.get("error");
        if (errorParam) {
            toast({
                title: "Authentication Error",
                description: "Something went wrong during sign in. Please try again.",
                variant: "destructive",
            });
        }
    }, [searchParams, toast]);

    // GSAP entrance animation
    useEffect(() => {
        if (!containerRef.current) return;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            tl.from(".auth-logo", { y: -30, opacity: 0, duration: 0.6 })
                .from(".auth-title", { y: 20, opacity: 0, duration: 0.5 }, "-=0.3")
                .from(".auth-subtitle", { y: 20, opacity: 0, duration: 0.5 }, "-=0.3")
                .from(".auth-social-btn", { y: 15, opacity: 0, stagger: 0.1, duration: 0.4 }, "-=0.2")
                .from(".auth-divider", { scaleX: 0, opacity: 0, duration: 0.4 }, "-=0.2")
                .from(".auth-input", { y: 15, opacity: 0, stagger: 0.1, duration: 0.4 }, "-=0.2")
                .from(".auth-submit", { y: 10, opacity: 0, duration: 0.4 }, "-=0.2")
                .from(".auth-footer", { opacity: 0, duration: 0.4 }, "-=0.2");
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const handleLogin = async (formData: FormData) => {
        setError(null);
        startTransition(async () => {
            const result = await login(formData);
            if (result?.error) {
                setError(result.error);
            }
        });
    };

    const handleOAuth = (provider: 'google' | 'github' | 'facebook' | 'apple') => {
        startTransition(async () => {
            const result = await loginWithOAuth(provider);
            if (result?.error) {
                toast({
                    title: "Authentication Error",
                    description: result.error,
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4 md:p-8">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 opacity-50 blur-[120px]" />
                <div className="absolute right-0 top-0 h-[400px] w-[400px] bg-blue-500/10 opacity-30 blur-[100px]" />
                <div className="absolute bottom-0 left-0 h-[400px] w-[400px] bg-purple-500/10 opacity-30 blur-[100px]" />
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>

            {/* Back button */}
            <div className="absolute left-4 top-4 z-20 md:left-8 md:top-8">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                        <MoveLeft className="h-4 w-4" />
                        Back
                    </Button>
                </Link>
            </div>

            {/* Main card */}
            <div ref={containerRef} className="z-10 w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl"
                >
                    {/* Logo & Title */}
                    <div className="mb-8 text-center">
                        <div className="auth-logo mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-lg shadow-primary/10">
                            <img src="/assets/Logo.svg" alt="Arivolam" className="h-9 w-9" />
                        </div>
                        <h1 className="auth-title text-2xl font-bold tracking-tight">Welcome back</h1>
                        <p className="auth-subtitle mt-2 text-sm text-muted-foreground">
                            Sign in to your Arivolam account
                        </p>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        {socialProviders.map((provider) => (
                            <button
                                key={provider.id}
                                onClick={() => handleOAuth(provider.id)}
                                disabled={isPending}
                                className="auth-social-btn flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm font-medium transition-all hover:bg-muted hover:border-border hover:shadow-sm disabled:opacity-50"
                            >
                                {provider.icon}
                                <span className="hidden sm:inline">{provider.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="auth-divider my-6 flex items-center gap-4">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
                        <Separator className="flex-1" />
                    </div>

                    {/* Email Form */}
                    <form action={handleLogin} className="space-y-4">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="auth-input space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">
                                Email
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="auth-input space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </Label>
                                <Link href="#" className="text-xs text-primary hover:underline">
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    required
                                    className="pl-10 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="auth-submit w-full rounded-xl text-base font-semibold"
                            size="lg"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                    Signing in...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Sign in
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="auth-footer mt-6 space-y-4 text-center text-sm text-muted-foreground">
                        <p>
                            Don&apos;t have an account?{" "}
                            <Link href="/auth/signup" className="font-semibold text-primary hover:underline">
                                Create one
                            </Link>
                        </p>
                        <p className="text-xs">
                            By signing in, you agree to our{" "}
                            <Link href="#" className="underline underline-offset-4 hover:text-primary">
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="#" className="underline underline-offset-4 hover:text-primary">
                                Privacy Policy
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginPageInner />
        </Suspense>
    );
}
