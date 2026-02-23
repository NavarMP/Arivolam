"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Building2,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Loader2,
    Globe,
    MapPin,
    User,
    KeyRound,
    Mail,
    AlertCircle,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdaptiveLogo } from "@/components/shared/adaptive-logo";
import { toast } from "sonner";
import { registerInstitution } from "@/app/campus/actions";

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

type Step = "institution" | "location" | "admin" | "success";

export default function CampusCreatePage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("institution");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Institution fields
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [shortName, setShortName] = useState("");
    const [type, setType] = useState("college");
    const [description, setDescription] = useState("");

    // Location fields
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [country, setCountry] = useState("India");

    // Admin fields
    const [adminName, setAdminName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Slug validation
    const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
    const debouncedSlug = useDebounce(slug, 500);

    // Auto-generate slug from name
    useEffect(() => {
        if (name && !slug) {
            const generated = name
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-")
                .substring(0, 30);
            setSlug(generated);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name]);

    // Validate slug availability
    useEffect(() => {
        if (!debouncedSlug || debouncedSlug.length < 3) {
            setSlugStatus("idle");
            return;
        }
        const validateSlug = async () => {
            setSlugStatus("checking");
            try {
                const res = await fetch(`/api/campus/validate-slug?slug=${encodeURIComponent(debouncedSlug)}`);
                const data = await res.json();
                setSlugStatus(data.available ? "available" : "taken");
            } catch {
                setSlugStatus("idle");
            }
        };
        validateSlug();
    }, [debouncedSlug]);

    const canProceedStep1 = name.length >= 3 && slug.length >= 3 && slugStatus === "available";
    const canProceedStep2 = true; // Location is optional
    const canProceedStep3 =
        adminName.length >= 2 &&
        adminEmail.includes("@") &&
        adminPassword.length >= 6 &&
        adminPassword === confirmPassword;

    async function handleSubmit() {
        if (!canProceedStep3) return;
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("slug", slug);
            formData.append("shortName", shortName);
            formData.append("type", type);
            formData.append("description", description);
            formData.append("city", city);
            formData.append("state", state);
            formData.append("country", country);
            formData.append("adminName", adminName);
            formData.append("adminEmail", adminEmail);
            formData.append("adminPassword", adminPassword);

            const result = await registerInstitution(formData);

            if (result?.error) {
                toast.error(result.error);
                setIsSubmitting(false);
                return;
            }

            setStep("success");
        } catch {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
        { key: "institution", label: "Institution", icon: <Building2 className="h-4 w-4" /> },
        { key: "location", label: "Location", icon: <MapPin className="h-4 w-4" /> },
        { key: "admin", label: "Admin Account", icon: <User className="h-4 w-4" /> },
    ];

    const currentStepIndex = steps.findIndex((s) => s.key === step);

    return (
        <div className="relative min-h-screen bg-background overflow-hidden flex flex-col items-center justify-center p-4">
            {/* Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
            </div>

            {/* Back link */}
            <div className="absolute top-6 left-6 md:left-8 z-20">
                <Link
                    href="/campus"
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Campus Home
                </Link>
            </div>

            <div className="relative z-10 w-full max-w-lg">
                {step !== "success" && (
                    <>
                        {/* Header */}
                        <div className="mb-8 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Building2 className="h-7 w-7 text-primary" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight mb-2">Register Institution</h1>
                            <p className="text-muted-foreground text-sm">
                                Set up your campus on the Arivolam platform
                            </p>
                        </div>

                        {/* Step Indicator */}
                        <div className="flex items-center justify-center gap-2 mb-8">
                            {steps.map((s, i) => (
                                <div key={s.key} className="flex items-center gap-2">
                                    <div
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${i <= currentStepIndex
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        {i < currentStepIndex ? (
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                        ) : (
                                            s.icon
                                        )}
                                        <span className="hidden sm:inline">{s.label}</span>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className={`h-px w-6 ${i < currentStepIndex ? "bg-primary" : "bg-border"}`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Form Card */}
                <div className="p-1 rounded-3xl bg-gradient-to-br from-primary/20 via-border/50 to-transparent">
                    <div className="rounded-[22px] bg-card/80 p-8 shadow-2xl backdrop-blur-xl border border-border/50">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Institution Details */}
                            {step === "institution" && (
                                <motion.div
                                    key="step-institution"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-5"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-medium ml-1">
                                            Institution Name *
                                        </Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. SAFI Institute of Advanced Study"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="h-11 rounded-xl bg-background/50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="slug" className="text-sm font-medium ml-1">
                                            Campus URL (slug) *
                                        </Label>
                                        <div className="relative">
                                            <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                            <Input
                                                id="slug"
                                                placeholder="e.g. sias"
                                                value={slug}
                                                onChange={(e) =>
                                                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                                                }
                                                className="h-11 pl-10 pr-10 rounded-xl bg-background/50"
                                            />
                                            <div className="absolute right-3.5 top-3 z-10">
                                                {slugStatus === "checking" && (
                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                )}
                                                {slugStatus === "available" && (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                )}
                                                {slugStatus === "taken" && (
                                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground ml-1">
                                            Your campus will be at: <span className="font-mono text-foreground">arivolam.com/campus/{slug || "..."}</span>
                                        </p>
                                        {slugStatus === "taken" && (
                                            <p className="text-xs text-destructive ml-1">This slug is already taken.</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="shortName" className="text-sm font-medium ml-1">
                                                Short Name
                                            </Label>
                                            <Input
                                                id="shortName"
                                                placeholder="e.g. SIAS"
                                                value={shortName}
                                                onChange={(e) => setShortName(e.target.value)}
                                                className="h-11 rounded-xl bg-background/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="type" className="text-sm font-medium ml-1">
                                                Type
                                            </Label>
                                            <select
                                                id="type"
                                                value={type}
                                                onChange={(e) => setType(e.target.value)}
                                                className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            >
                                                <option value="university">University</option>
                                                <option value="college">College</option>
                                                <option value="school">School</option>
                                                <option value="institute">Institute</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-sm font-medium ml-1">
                                            Description
                                        </Label>
                                        <textarea
                                            id="description"
                                            placeholder="Brief description of your institution..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={3}
                                            className="flex w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                                        />
                                    </div>

                                    <Button
                                        type="button"
                                        className="w-full h-11 rounded-xl gap-2"
                                        disabled={!canProceedStep1}
                                        onClick={() => setStep("location")}
                                    >
                                        Continue
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </motion.div>
                            )}

                            {/* Step 2: Location */}
                            {step === "location" && (
                                <motion.div
                                    key="step-location"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="city" className="text-sm font-medium ml-1">City</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                            <Input
                                                id="city"
                                                placeholder="e.g. Malappuram"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                className="h-11 pl-10 rounded-xl bg-background/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="state" className="text-sm font-medium ml-1">State</Label>
                                            <Input
                                                id="state"
                                                placeholder="e.g. Kerala"
                                                value={state}
                                                onChange={(e) => setState(e.target.value)}
                                                className="h-11 rounded-xl bg-background/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country" className="text-sm font-medium ml-1">Country</Label>
                                            <Input
                                                id="country"
                                                placeholder="India"
                                                value={country}
                                                onChange={(e) => setCountry(e.target.value)}
                                                className="h-11 rounded-xl bg-background/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 h-11 rounded-xl gap-2"
                                            onClick={() => setStep("institution")}
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Back
                                        </Button>
                                        <Button
                                            type="button"
                                            className="flex-1 h-11 rounded-xl gap-2"
                                            disabled={!canProceedStep2}
                                            onClick={() => setStep("admin")}
                                        >
                                            Continue
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Admin Account */}
                            {step === "admin" && (
                                <motion.div
                                    key="step-admin"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400">
                                        This will be the founding administrator account for your institution.
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="adminName" className="text-sm font-medium ml-1">
                                            Full Name *
                                        </Label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                            <Input
                                                id="adminName"
                                                placeholder="Your full name"
                                                value={adminName}
                                                onChange={(e) => setAdminName(e.target.value)}
                                                className="h-11 pl-10 rounded-xl bg-background/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="adminEmail" className="text-sm font-medium ml-1">
                                            Email Address *
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                            <Input
                                                id="adminEmail"
                                                type="email"
                                                placeholder="admin@institution.edu"
                                                value={adminEmail}
                                                onChange={(e) => setAdminEmail(e.target.value)}
                                                className="h-11 pl-10 rounded-xl bg-background/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="adminPassword" className="text-sm font-medium ml-1">
                                            Password *
                                        </Label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                            <Input
                                                id="adminPassword"
                                                type="password"
                                                placeholder="Min 6 characters"
                                                value={adminPassword}
                                                onChange={(e) => setAdminPassword(e.target.value)}
                                                className="h-11 pl-10 rounded-xl bg-background/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="text-sm font-medium ml-1">
                                            Confirm Password *
                                        </Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="Re-enter password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="h-11 rounded-xl bg-background/50"
                                        />
                                        {confirmPassword && confirmPassword !== adminPassword && (
                                            <p className="text-xs text-destructive ml-1">Passwords do not match.</p>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 h-11 rounded-xl gap-2"
                                            onClick={() => setStep("location")}
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Back
                                        </Button>
                                        <Button
                                            type="button"
                                            className="flex-1 h-11 rounded-xl gap-2"
                                            disabled={!canProceedStep3 || isSubmitting}
                                            onClick={handleSubmit}
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    Register
                                                    <Sparkles className="h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Success */}
                            {step === "success" && (
                                <motion.div
                                    key="step-success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center space-y-6 py-4"
                                >
                                    <div className="flex justify-center">
                                        <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2">Registration Submitted!</h2>
                                        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                                            Your institution <span className="font-semibold text-foreground">{name}</span> has been registered and is pending approval by the Arivolam team. You&apos;ll be notified once it&apos;s activated.
                                        </p>
                                    </div>

                                    <div className="p-3 rounded-xl bg-muted/50 border border-border/50 text-xs text-muted-foreground space-y-1">
                                        <p><span className="font-medium text-foreground">Admin Email:</span> {adminEmail}</p>
                                        <p><span className="font-medium text-foreground">Campus URL:</span> /campus/{slug}</p>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <Button
                                            onClick={() => router.push("/campus")}
                                            className="w-full h-11 rounded-xl gap-2"
                                        >
                                            <AdaptiveLogo size={16} />
                                            Back to Campus Home
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer */}
                {step !== "success" && (
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an institution?{" "}
                        <Link href="/campus/login" className="font-semibold text-primary hover:underline">
                            Log in here
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
