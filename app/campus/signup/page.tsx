"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Building2,
    ArrowLeft,
    User,
    KeyRound,
    Mail,
    Phone,
    Loader2,
    CheckCircle2,
    AlertCircle,
    GraduationCap,
    BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { campusSignup } from "@/app/campus/actions";
import { cn } from "@/lib/utils";
import { useClickAway } from "react-use";

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
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

export default function CampusSignupPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Institution search
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    useClickAway(dropdownRef, () => setIsDropdownOpen(false));

    // User fields
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [registerNumber, setRegisterNumber] = useState("");
    const [admissionNumber, setAdmissionNumber] = useState("");
    const [role, setRole] = useState("student");
    const [department, setDepartment] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

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

    const hasIdNumber = !!registerNumber || !!admissionNumber;
    const canSubmit =
        selectedInstitution &&
        fullName.length >= 2 &&
        email.includes("@") &&
        phone.length >= 7 &&
        (role !== "student" || hasIdNumber) &&
        password.length >= 6 &&
        password === confirmPassword;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!canSubmit) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("institutionId", selectedInstitution!.id);
            formData.append("fullName", fullName);
            formData.append("email", email);
            formData.append("phone", phone);
            formData.append("registerNumber", registerNumber);
            formData.append("admissionNumber", admissionNumber);
            formData.append("role", role);
            formData.append("department", department);
            formData.append("password", password);

            const result = await campusSignup(formData);

            if (result?.error) {
                toast.error(result.error);
                return;
            }

            setSuccess(true);
        } catch {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const resetSelection = () => {
        setSelectedInstitution(null);
        setSearchQuery("");
    };

    return (
        <div className="relative min-h-screen bg-background overflow-hidden flex flex-col items-center justify-center p-4">
            {/* Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[120px] rounded-full" />
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

            <div className="relative z-10 w-full max-w-md">
                {!success && (
                    <div className="mb-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <GraduationCap className="h-7 w-7 text-emerald-500" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Campus Sign Up</h1>
                        <p className="text-muted-foreground text-sm">
                            Request access to your institution&apos;s campus portal
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-1 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-border/50 to-transparent">
                    <div className="rounded-[22px] bg-card/80 p-8 shadow-2xl backdrop-blur-xl border border-border/50 relative overflow-hidden">
                        {/* Badge */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500">Sign Up</span>
                        </div>

                        <AnimatePresence mode="wait">
                            {success ? (
                                <motion.div
                                    key="success"
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
                                        <h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
                                        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                                            Your signup request for <span className="font-semibold text-foreground">{selectedInstitution?.name}</span> has been submitted. An institution administrator will review and approve your access.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => window.location.href = "/campus/login"}
                                        className="w-full h-11 rounded-xl gap-2"
                                    >
                                        Go to Login
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-5 mt-4"
                                >
                                    {/* Institution Selection */}
                                    {!selectedInstitution ? (
                                        <div className="space-y-2 relative" ref={dropdownRef}>
                                            <Label htmlFor="campus" className="text-sm font-medium ml-1">
                                                Find your Institution *
                                            </Label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                                <Input
                                                    id="campus"
                                                    placeholder="Search by institution name..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onFocus={() => institutions.length > 0 && setIsDropdownOpen(true)}
                                                    className="h-11 pl-10 pr-10 bg-background/50 rounded-xl"
                                                    autoComplete="off"
                                                />
                                                {isSearching && (
                                                    <div className="absolute right-3.5 top-3.5 z-10">
                                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>

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
                                                            <AlertCircle className="w-4 h-4" /> No institutions found.
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Selected institution */}
                                            {/* Role Selection */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium ml-1">I am signing up as a...</Label>
                                                <div className="flex p-1 bg-muted/50 rounded-xl">
                                                    {['student', 'staff', 'parent'].map((r) => (
                                                        <button
                                                            key={r}
                                                            type="button"
                                                            onClick={(e) => { e.preventDefault(); setRole(r); }}
                                                            className={cn(
                                                                "flex-1 text-sm font-medium py-2.5 rounded-lg transition-all capitalize",
                                                                role === r
                                                                    ? "bg-background shadow-sm text-primary ring-1 ring-border/50"
                                                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                                            )}
                                                        >
                                                            {r}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Selected institution */}
                                            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-1 items-start relative mt-4">
                                                <div className="absolute right-3 top-4 cursor-pointer text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors" onClick={resetSelection}>
                                                    Change
                                                </div>
                                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                                                </span>
                                                <span className="text-sm font-medium w-3/4 truncate">{selectedInstitution.name}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mt-4">
                                                <div className="space-y-2 col-span-2">
                                                    <Label htmlFor="fullName" className="text-sm font-medium ml-1">Full Name *</Label>
                                                    <div className="relative">
                                                        <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                                        <Input id="fullName" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 pl-10 rounded-xl bg-background/50" required />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="email" className="text-sm font-medium ml-1">Email *</Label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                                        <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 pl-10 rounded-xl bg-background/50" required />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="phone" className="text-sm font-medium ml-1">Phone Number *</Label>
                                                    <div className="relative">
                                                        <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                                        <Input id="phone" type="tel" placeholder="+91 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 pl-10 rounded-xl bg-background/50" required />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Role-Specific Fields */}
                                            {role === "student" && (
                                                <div className="space-y-4 pt-4 mt-2 border-t border-border/50">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="registerNumber" className="text-sm font-medium ml-1">Register No.</Label>
                                                            <Input id="registerNumber" placeholder="REG001" value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} className="h-11 rounded-xl bg-background/50" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="admissionNumber" className="text-sm font-medium ml-1">Admission No.</Label>
                                                            <Input id="admissionNumber" placeholder="ADM001" value={admissionNumber} onChange={(e) => setAdmissionNumber(e.target.value)} className="h-11 rounded-xl bg-background/50" />
                                                        </div>
                                                    </div>
                                                    {!hasIdNumber && (
                                                        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 ml-1">
                                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                                            At least one of Register No. or Admission No. is required.
                                                        </p>
                                                    )}
                                                    <div className="space-y-2">
                                                        <Label htmlFor="department" className="text-sm font-medium ml-1">Department (Optional)</Label>
                                                        <Input id="department" placeholder="e.g. Computer Science" value={department} onChange={(e) => setDepartment(e.target.value)} className="h-11 rounded-xl bg-background/50" />
                                                    </div>
                                                </div>
                                            )}

                                            {role === "staff" && (
                                                <div className="space-y-4 pt-4 mt-2 border-t border-border/50">
                                                    <div className="p-3 mb-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
                                                        Staff members will be verified by the campus admin upon request submission.
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="registerNumber" className="text-sm font-medium ml-1">Employee ID (Optional)</Label>
                                                            <Input id="registerNumber" placeholder="EMP001" value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} className="h-11 rounded-xl bg-background/50" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="department" className="text-sm font-medium ml-1">Department</Label>
                                                            <Input id="department" placeholder="e.g. Science Dept" value={department} onChange={(e) => setDepartment(e.target.value)} className="h-11 rounded-xl bg-background/50" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {role === "parent" && (
                                                <div className="space-y-4 pt-4 mt-2 border-t border-border/50">
                                                    <div className="p-3 mb-2 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 flex gap-2">
                                                        <User className="h-4 w-4 shrink-0" />
                                                        <p>Parents do not need an ID number. Once your account is approved, you will be able to link it to your child's student dashboard.</p>
                                                    </div>
                                                </div>
                                            )}



                                            {/* Password */}
                                            <div className="space-y-2">
                                                <Label htmlFor="password" className="text-sm font-medium ml-1">Password *</Label>
                                                <div className="relative">
                                                    <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground z-10" />
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        placeholder="Min 6 characters"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="h-11 pl-10 rounded-xl bg-background/50"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="confirmPwd" className="text-sm font-medium ml-1">Confirm Password *</Label>
                                                <Input
                                                    id="confirmPwd"
                                                    type="password"
                                                    placeholder="Re-enter password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="h-11 rounded-xl bg-background/50"
                                                    required
                                                />
                                                {confirmPassword && confirmPassword !== password && (
                                                    <p className="text-xs text-destructive ml-1">Passwords do not match.</p>
                                                )}
                                            </div>

                                            <Button
                                                type="submit"
                                                className="w-full h-11 rounded-xl gap-2 mt-2"
                                                disabled={!canSubmit || isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        Request Access
                                                        <GraduationCap className="h-4 w-4" />
                                                    </>
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </form>

                {!success && (
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/campus/login" className="font-semibold text-primary hover:underline">
                            Log in here
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
