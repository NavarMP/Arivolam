"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    ArrowLeft,
    User,
    Building2,
    GraduationCap,
    BookOpen,
    FlaskConical,
    UserCheck,
    Eye,
    Users,
    Check,
    X,
    Loader2,
    AtSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdaptiveLogo } from "@/components/shared/adaptive-logo";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/hooks/use-toast";

const profileTypes = [
    {
        id: "personal",
        label: "Personal",
        description: "For students, professors, researchers, and individuals",
        icon: User,
        gradient: "from-blue-500/20 to-violet-500/20",
        border: "border-blue-500/30",
        text: "text-blue-500",
    },
    {
        id: "institution",
        label: "Institution",
        description: "For universities, colleges, schools, and organizations",
        icon: Building2,
        gradient: "from-emerald-500/20 to-teal-500/20",
        border: "border-emerald-500/30",
        text: "text-emerald-500",
    },
];

const subTypes = [
    { id: "student", label: "Student", icon: GraduationCap },
    { id: "professor", label: "Professor", icon: BookOpen },
    { id: "researcher", label: "Researcher", icon: FlaskConical },
    { id: "alumni", label: "Alumni", icon: UserCheck },
    { id: "visitor", label: "Visitor", icon: Eye },
    { id: "parent", label: "Parent", icon: Users },
];

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const [profileType, setProfileType] = useState<string>("");
    const [subType, setSubType] = useState<string>("student");
    const [username, setUsername] = useState("");
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [headline, setHeadline] = useState("");
    const [bio, setBio] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { toast } = useToast();

    // Pre-fill display name from auth
    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata?.full_name) {
                setDisplayName(user.user_metadata.full_name);
            }
        };
        fetchUser();
    }, []);

    // Debounced username check
    const checkUsername = useCallback(async (value: string) => {
        if (value.length < 3) {
            setUsernameAvailable(null);
            return;
        }
        setCheckingUsername(true);
        const supabase = createClient();
        const { data } = await supabase.rpc("check_username_available", {
            desired_username: value,
        });
        setUsernameAvailable(data ?? false);
        setCheckingUsername(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (username.length >= 3) checkUsername(username);
        }, 500);
        return () => clearTimeout(timer);
    }, [username, checkUsername]);

    const handleComplete = () => {
        startTransition(async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.rpc("claim_username", {
                user_id: user.id,
                desired_username: username,
                p_display_name: displayName || null,
                p_profile_type: profileType,
                p_sub_type: profileType === "personal" ? subType : null,
                p_headline: headline || null,
                p_bio: bio || null,
            });

            if (error) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
                return;
            }

            toast({ title: "Profile set up! 🎉", description: "Welcome to Arivolam." });
            router.push("/");
        });
    };

    const canProceed = () => {
        switch (step) {
            case 0:
                return !!profileType;
            case 1:
                return profileType === "institution" || !!subType;
            case 2:
                return username.length >= 3 && usernameAvailable === true;
            case 3:
                return true;
            default:
                return false;
        }
    };

    const totalSteps = profileType === "personal" ? 4 : 3;

    const slideVariants = {
        enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (direction: number) => ({ x: direction > 0 ? -80 : 80, opacity: 0 }),
    };

    const [direction, setDirection] = useState(0);

    const nextStep = () => {
        setDirection(1);
        // For institution type, skip sub-type step
        if (step === 0 && profileType === "institution") {
            setStep(2);
        } else {
            setStep((s) => s + 1);
        }
    };

    const prevStep = () => {
        setDirection(-1);
        if (step === 2 && profileType === "institution") {
            setStep(0);
        } else {
            setStep((s) => s - 1);
        }
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4 md:p-8">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 opacity-40 blur-[120px]" />
                <div className="absolute right-0 bottom-0 h-[400px] w-[400px] bg-blue-500/10 opacity-30 blur-[100px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>

            <div className="z-10 w-full max-w-lg">
                {/* Progress bar */}
                <div className="mb-6 flex items-center gap-2">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? "bg-primary" : "bg-muted"
                                }`}
                        />
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl"
                >
                    {/* Header */}
                    <div className="mb-6 text-center">
                        <AdaptiveLogo size={48} className="mx-auto mb-4" />
                        <h1 className="text-xl font-bold tracking-tight">Set up your profile</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Step {step + 1} of {totalSteps}
                        </p>
                    </div>

                    {/* Steps */}
                    <AnimatePresence mode="wait" custom={direction}>
                        {/* Step 0: Profile Type */}
                        {step === 0 && (
                            <motion.div
                                key="type"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                <h2 className="text-center text-lg font-semibold">
                                    What type of account?
                                </h2>
                                <div className="grid gap-3">
                                    {profileTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setProfileType(type.id)}
                                            className={`group flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${profileType === type.id
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
                                            {profileType === type.id && (
                                                <Check className={`ml-auto h-5 w-5 ${type.text}`} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 1: Sub-type (personal only) */}
                        {step === 1 && profileType === "personal" && (
                            <motion.div
                                key="subtype"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                <h2 className="text-center text-lg font-semibold">What describes you?</h2>
                                <div className="grid grid-cols-2 gap-2">
                                    {subTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setSubType(type.id)}
                                            className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${subType === type.id
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border/50 hover:border-border"
                                                }`}
                                        >
                                            <type.icon
                                                className={`h-6 w-6 ${subType === type.id
                                                        ? "text-primary"
                                                        : "text-muted-foreground"
                                                    }`}
                                            />
                                            <span className="text-sm font-medium">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Username */}
                        {step === 2 && (
                            <motion.div
                                key="username"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                <h2 className="text-center text-lg font-semibold">
                                    Choose your username
                                </h2>
                                <p className="text-center text-sm text-muted-foreground">
                                    This will be your public URL: arivolam.com/<strong>{username || "..."}</strong>
                                </p>
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <div className="relative">
                                        <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="username"
                                            value={username}
                                            onChange={(e) => {
                                                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                                                setUsernameAvailable(null);
                                            }}
                                            placeholder="your_username"
                                            className="pl-10 pr-10"
                                            maxLength={30}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {checkingUsername && (
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            )}
                                            {!checkingUsername && usernameAvailable === true && (
                                                <Check className="h-4 w-4 text-emerald-500" />
                                            )}
                                            {!checkingUsername && usernameAvailable === false && (
                                                <X className="h-4 w-4 text-destructive" />
                                            )}
                                        </div>
                                    </div>
                                    {usernameAvailable === false && (
                                        <p className="text-xs text-destructive">Username is taken</p>
                                    )}
                                    {usernameAvailable === true && (
                                        <p className="text-xs text-emerald-500">Username is available!</p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Profile details */}
                        {step === 3 && (
                            <motion.div
                                key="details"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.2 }}
                                className="space-y-4"
                            >
                                <h2 className="text-center text-lg font-semibold">
                                    Tell us about yourself
                                </h2>
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="displayName">Display Name</Label>
                                        <Input
                                            id="displayName"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="headline">
                                            Headline <span className="text-muted-foreground">(optional)</span>
                                        </Label>
                                        <Input
                                            id="headline"
                                            value={headline}
                                            onChange={(e) => setHeadline(e.target.value)}
                                            placeholder="e.g. CS Student at SIAS"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bio">
                                            Bio <span className="text-muted-foreground">(optional)</span>
                                        </Label>
                                        <Textarea
                                            id="bio"
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="A short bio about yourself..."
                                            className="resize-none"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation buttons */}
                    <div className="mt-8 flex items-center justify-between">
                        {step > 0 ? (
                            <Button variant="ghost" onClick={prevStep} className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        ) : (
                            <div />
                        )}

                        {step < totalSteps - 1 ? (
                            <Button
                                onClick={nextStep}
                                disabled={!canProceed()}
                                className="gap-2 rounded-xl px-6"
                            >
                                Next
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleComplete}
                                disabled={isPending}
                                className="gap-2 rounded-xl px-6"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        Complete Setup
                                        <Check className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Skip option */}
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => router.push("/")}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Skip for now
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
