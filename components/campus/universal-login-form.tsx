"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Building2, User, KeyRound, CheckCircle2, AlertCircle, ChevronDown, MapPin, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { campusLogin } from "@/app/campus/actions";
import { cn } from "@/lib/utils";
import { useClickAway } from "react-use";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

interface Institution {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    short_name?: string;
    description?: string;
    city?: string;
    state?: string;
    cover_url?: string;
}

export function UniversalLoginForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Selection & Auth State
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
    const [identifier, setIdentifier] = useState(""); // Admission number / Employee ID
    const [password, setPassword] = useState("");

    const dropdownRef = useRef<HTMLDivElement>(null);
    useClickAway(dropdownRef, () => setIsDropdownOpen(false));

    // Fetch institutions
    useEffect(() => {
        const fetchInstitutions = async () => {
            if (!debouncedSearch) {
                setInstitutions([]);
                return;
            }
            setIsSearching(true);
            try {
                const response = await fetch(`/api/campus/search?q=${encodeURIComponent(debouncedSearch)}`);
                const data = await response.json();
                if (data.institutions) {
                    setInstitutions(data.institutions);
                    setIsDropdownOpen(true);
                }
            } catch (error) {
                console.error("Failed to fetch institutions", error);
            } finally {
                setIsSearching(false);
            }
        };
        fetchInstitutions();
    }, [debouncedSearch]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selectedInstitution) {
            toast.error("Please select your institution first");
            return;
        }
        if (!identifier || !password) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("institutionId", selectedInstitution.id);
            formData.append("identifier", identifier);
            formData.append("password", password);

            const result = await campusLogin(formData);

            if (result?.error) {
                setError(result.error);
                toast.error(result.error);
                return;
            }

            if (result?.success && result?.slug) {
                toast.success("Welcome back to your Campus!");
                setTimeout(() => {
                    router.push(`/campus/${result.slug}`);
                    router.refresh();
                }, 500);
            }

        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            toast.error("An unexpected error occurred. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    const resetSelection = () => {
        setSelectedInstitution(null);
        setSearchQuery("");
        setIdentifier("");
        setPassword("");
    };

    return (
        <form onSubmit={handleSubmit} className="relative z-10 p-1 rounded-3xl bg-gradient-to-br from-primary/20 via-border/50 to-transparent">
            {/* Glossy Backdrop Card */}
            <div className="rounded-[22px] bg-card/80 p-8 shadow-2xl backdrop-blur-xl border border-border/50 relative overflow-hidden">

                {/* Top Right Identifier */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary">ERP Login</span>
                </div>

                <div className="space-y-6 mt-4">

                    {/* Step 1: Campus Selection */}
                    <AnimatePresence mode="popLayout">
                        {!selectedInstitution ? (
                            <motion.div
                                key="search-step"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <div className="space-y-2 relative" ref={dropdownRef}>
                                    <Label htmlFor="campus" className="text-sm font-medium text-foreground ml-1">
                                        Find your Campus
                                    </Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                        <Input
                                            id="campus"
                                            placeholder="Example: SAFI Institute..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onFocus={() => institutions.length > 0 && setIsDropdownOpen(true)}
                                            className="h-11 pl-10 pr-10 bg-background/50 border-white/10 dark:border-white/5 shadow-inner rounded-xl focus-visible:ring-primary/50 transition-all text-sm pb-0.5"
                                            autoComplete="off"
                                        />
                                        {isSearching && (
                                            <div className="absolute right-3.5 top-3.5 z-10">
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Dropdown Results */}
                                    <AnimatePresence>
                                        {isDropdownOpen && institutions.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute w-full mt-2 rounded-xl border border-border/50 bg-popover/90 backdrop-blur-xl shadow-xl overflow-hidden z-50"
                                            >
                                                <ul>
                                                    {institutions.map((inst) => (
                                                        <li
                                                            key={inst.id}
                                                            onClick={() => {
                                                                setSelectedInstitution(inst);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                                {inst.logo_url ? (
                                                                    <img src={inst.logo_url} alt="" className="w-6 h-6 object-contain" />
                                                                ) : (
                                                                    <Building2 className="w-4 h-4 text-primary" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-sm font-medium truncate block">{inst.name}</span>
                                                                {(inst.city || inst.state) && (
                                                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                                        <MapPin className="h-2.5 w-2.5" />
                                                                        {[inst.city, inst.state].filter(Boolean).join(", ")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </motion.div>
                                        )}
                                        {isDropdownOpen && debouncedSearch && institutions.length === 0 && !isSearching && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute w-full mt-2 rounded-xl border border-border/50 bg-popover/90 backdrop-blur-xl shadow-xl p-4 text-center z-50"
                                            >
                                                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                                                    <AlertCircle className="w-4 h-4" /> No campus found.
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ) : (
                            // Step 2: Credentials Input
                            <motion.div
                                key="credentials-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-5"
                            >
                                {/* Selected Campus Details Card */}
                                <div className="rounded-xl bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-primary/20 overflow-hidden relative group">
                                    {/* Cover/Header Section */}
                                    {selectedInstitution.cover_url ? (
                                        <div className="h-20 w-full relative">
                                            <img
                                                src={selectedInstitution.cover_url}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                                        </div>
                                    ) : (
                                        <div className="h-12 w-full bg-gradient-to-r from-primary/10 to-primary/5" />
                                    )}

                                    {/* Institution Info */}
                                    <div className="px-4 pb-4 -mt-5 relative">
                                        {/* Logo */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border/50 shadow-sm overflow-hidden">
                                                {selectedInstitution.logo_url ? (
                                                    <img src={selectedInstitution.logo_url} alt="" className="h-8 w-8 object-contain" />
                                                ) : (
                                                    <GraduationCap className="h-5 w-5 text-primary" />
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={resetSelection}
                                                className="mt-6 text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"
                                            >
                                                Change
                                            </button>
                                        </div>

                                        {/* Name + Badge */}
                                        <div className="mt-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-semibold truncate">{selectedInstitution.name}</h3>
                                                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                                                    <CheckCircle2 className="w-3 h-3" /> Selected
                                                </span>
                                            </div>
                                            {selectedInstitution.description && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {selectedInstitution.description}
                                                </p>
                                            )}
                                            {(selectedInstitution.city || selectedInstitution.state) && (
                                                <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                                                    <MapPin className="h-3 w-3 shrink-0" />
                                                    <span>{[selectedInstitution.city, selectedInstitution.state].filter(Boolean).join(", ")}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="identifier" className="text-sm font-medium text-foreground ml-1">
                                        Email, Admission No. or Register No.
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                        <Input
                                            id="identifier"
                                            placeholder="your@email.com or ID number"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            className="h-11 pl-10 bg-background/50 border-white/10 dark:border-white/5 shadow-inner rounded-xl focus-visible:ring-primary/50 transition-all text-sm pb-0.5"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-medium text-foreground ml-1">
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="h-11 pl-10 bg-background/50 border-white/10 dark:border-white/5 shadow-inner rounded-xl focus-visible:ring-primary/50 transition-all text-sm pb-0.5"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs text-destructive">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-11 text-base font-medium rounded-xl mt-2 group relative overflow-hidden"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            Sign In
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>

                {/* Signup Link */}
                <div className="mt-4 text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <a href="/campus/signup" className="font-semibold text-primary hover:underline">
                        Sign up here
                    </a>
                </div>
            </div>
        </form>
    );
}
