"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Building2, User, KeyRound, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { erpUniversalLogin } from "@/app/campus/actions";
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
}

export function UniversalLoginForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

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

        try {
            const formData = new FormData();
            formData.append("institutionId", selectedInstitution.id);
            formData.append("identifier", identifier);
            formData.append("password", password);

            const result = await erpUniversalLogin(formData);

            if (result?.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Welcome back to your Campus!");

            // Artificial delay for smooth UX transition
            setTimeout(() => {
                router.push(`/campus/${selectedInstitution.slug}/dashboard`); // Or appropriate dashboard route
                router.refresh();
            }, 1000);

        } catch (error) {
            toast.error("An unexpected error occurred. Please try again.");
            console.error(error);
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
                                                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                                                <Building2 className="w-4 h-4 text-primary" />
                                                            </div>
                                                            <span className="text-sm font-medium truncate">{inst.name}</span>
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
                                {/* Selected Campus Indicator */}
                                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex flex-col gap-1 items-start justify-between relative group">
                                    <div className="absolute right-3 top-4 cursor-pointer text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors" onClick={resetSelection}>
                                        Change
                                    </div>
                                    <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                                    </span>
                                    <span className="text-sm font-medium w-3/4 truncate pr-2">{selectedInstitution.name}</span>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="identifier" className="text-sm font-medium text-foreground ml-1">
                                        Admission or Employee ID
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                        <Input
                                            id="identifier"
                                            placeholder="Enter your unique ID"
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
            </div>
        </form>
    );
}
