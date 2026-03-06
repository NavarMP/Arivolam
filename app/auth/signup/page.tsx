"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, User, Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdaptiveLogo } from "@/components/shared/adaptive-logo";
import { signup, loginWithOAuth } from "../actions";

const accountTypes = [
    {
        id: "personal",
        label: "Personal Account",
        description: "For students, professors, researchers, and individuals",
        icon: User,
        gradient: "from-blue-500/20 to-violet-500/20",
        border: "border-blue-500/30",
        text: "text-blue-500",
    },
    {
        id: "institution",
        label: "Institution Account",
        description: "For universities, colleges, schools, and organizations",
        icon: Building2,
        gradient: "from-emerald-500/20 to-teal-500/20",
        border: "border-emerald-500/30",
        text: "text-emerald-500",
    },
];

export default function SignupPage() {
    const [step, setStep] = useState(0);
    const [accountType, setAccountType] = useState<"personal" | "institution" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [direction, setDirection] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Controlled inputs for client-side validation
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".auth-glow", { opacity: 0, scale: 0.8, duration: 1.2, ease: "power3.out" });
            gsap.from(".auth-card", { y: 40, opacity: 0, duration: 0.7, delay: 0.2, ease: "power3.out" });
            gsap.from(".auth-logo", { y: -20, opacity: 0, duration: 0.5, delay: 0.3, ease: "back.out(1.7)" });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const slideVariants = {
        enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (direction: number) => ({ x: direction > 0 ? -80 : 80, opacity: 0 }),
    };

    const nextStep = () => {
        if (!accountType) return;
        setDirection(1);
        setStep(1);
    };

    const prevStep = () => {
        setDirection(-1);
        setStep(0);
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (username.length < 3) {
            setError("Username must be at least 3 characters");
            return;
        }

        if (!/^[a-z0-9_]+$/.test(username)) {
            setError("Username can only contain lowercase letters, numbers, and underscores");
            return;
        }

        setLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.append("accountType", accountType as string);

        const result = await signup(formData);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    async function handleOAuth(provider: "google" | "github") {
        const res = await loginWithOAuth(provider);
        if (res?.error) {
            setError(res.error);
        } else if (res?.url) {
            window.location.href = res.url;
        }
    }

    return (
        <div ref={containerRef} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-animated" />
            <div className="absolute inset-0 bg-grid" />
            <div className="auth-glow absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/12 blur-[120px]" />
            <div className="absolute left-0 bottom-0 h-[300px] w-[300px] rounded-full bg-violet-500/8 blur-[100px]" />

            <div className="auth-card relative z-10 w-full max-w-md rounded-2xl border border-border/40 bg-card/80 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl sm:p-10 flex flex-col">
                <div className="auth-logo mb-6 text-center">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-lg glow-sm">
                        <AdaptiveLogo size={40} />
                    </div>
                </div>

                <div className="flex-1">
                    <AnimatePresence mode="wait" custom={direction}>
                        {step === 0 && (
                            <motion.div
                                key="step0"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                <div className="text-center">
                                    <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
                                    <p className="mt-1 text-sm text-muted-foreground">What type of account do you need?</p>
                                </div>

                                <div className="grid gap-3">
                                    {accountTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setAccountType(type.id as any)}
                                            className={`group flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${accountType === type.id
                                                ? `${type.border} bg-gradient-to-r ${type.gradient}`
                                                : "border-border/50 hover:border-border"
                                                }`}
                                        >
                                            <div
                                                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-background/80 ${type.text}`}
                                            >
                                                <type.icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{type.label}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {type.description}
                                                </p>
                                            </div>
                                            {accountType === type.id && (
                                                <Check className={`ml-auto h-5 w-5 ${type.text}`} />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="auth-social flex gap-3 mt-4">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        className="flex-1 gap-2 rounded-xl hover-lift"
                                        onClick={() => handleOAuth("google")}
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Google
                                    </Button>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        className="flex-1 gap-2 rounded-xl hover-lift"
                                        onClick={() => handleOAuth("github")}
                                    >
                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                        </svg>
                                        GitHub
                                    </Button>
                                </div>

                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={!accountType}
                                    className="w-full gap-2 rounded-xl py-5 font-semibold"
                                    size="lg"
                                >
                                    Continue
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        )}

                        {step === 1 && (
                            <motion.div
                                key="step1"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <Button type="button" variant="ghost" size="icon" onClick={prevStep} className="h-8 w-8 rounded-full">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <div>
                                        <h1 className="text-xl font-bold tracking-tight">
                                            {accountType === "institution" ? "Institution Details" : "Your Details"}
                                        </h1>
                                        <p className="text-xs text-muted-foreground">Fill in your information to continue</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName" className="text-xs font-medium">
                                            {accountType === "institution" ? "Institution Name" : "Full Name"}
                                        </Label>
                                        <Input
                                            id={accountType === "institution" ? "institutionName" : "fullName"}
                                            name={accountType === "institution" ? "institutionName" : "fullName"}
                                            placeholder={accountType === "institution" ? "e.g., University of Science" : "John Doe"}
                                            required
                                            className="rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="username" className="text-xs font-medium">Username / Handle</Label>
                                        <Input
                                            id="username"
                                            name="username"
                                            value={username}
                                            onChange={(e) => {
                                                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                                            }}
                                            placeholder="e.g., john_doe"
                                            required
                                            className="rounded-xl"
                                        />
                                    </div>

                                    {accountType === "institution" && (
                                        <div className="space-y-2">
                                            <Label htmlFor="website" className="text-xs font-medium">Institution Website (Optional)</Label>
                                            <Input
                                                id="website"
                                                name="website"
                                                type="url"
                                                placeholder="https://example.edu"
                                                className="rounded-xl"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs font-medium">
                                            {accountType === "institution" ? "Official Email" : "Email"}
                                        </Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            required
                                            className="rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                minLength={6}
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

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirm Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => {
                                                    setConfirmPassword(e.target.value);
                                                    if (error === "Passwords do not match") setError(null);
                                                }}
                                                required
                                                minLength={6}
                                                className={`rounded-xl pr-10 ${confirmPassword && password !== confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {confirmPassword && password !== confirmPassword && (
                                            <p className="text-[10px] text-destructive">Passwords do not match</p>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs text-destructive">
                                            {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={loading || (confirmPassword !== '' && password !== confirmPassword)}
                                        className="w-full gap-2 rounded-xl py-5 font-semibold shadow-lg shadow-primary/20 mt-2"
                                        size="lg"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                Create Account
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="mt-6 space-y-3 text-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                    <div className="flex justify-center gap-4 text-[10px] text-muted-foreground">
                        <Link href="/legal/terms" className="hover:text-foreground">Terms</Link>
                        <Link href="/legal/privacy" className="hover:text-foreground">Privacy</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
