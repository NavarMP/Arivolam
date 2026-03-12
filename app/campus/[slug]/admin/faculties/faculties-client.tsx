"use client";

import { useState, useTransition, useEffect } from "react";
import {
    Users, Search, MoreVertical, Mail, Phone, BadgeCheck, BookOpen,
    Loader2, CheckCircle, XCircle, Clock, Trash2, GraduationCap,
    Pencil, UserPlus, Hash, KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
    approveFacultyEnrollment, rejectFacultyEnrollment, removeFaculty,
    createFaculty, updateFaculty, previewNextEmployeeId,
} from "./actions";

// ═══════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════

interface FacultyAssignment {
    id: string;
    subject: { id: string; name: string; code: string } | null;
    class: { id: string; name: string } | null;
}

interface Faculty {
    id: string;
    full_name: string;
    email: string;
    register_number: string | null;
    admission_number: string | null;
    department: string | null;
    phone: string | null;
    created_at: string;
    is_approved: boolean;
    assignments: FacultyAssignment[];
}

interface PendingRequest {
    id: string;
    full_name: string;
    email: string;
    register_number: string | null;
    admission_number: string | null;
    department: string | null;
    phone: string | null;
    created_at: string;
}

interface Department {
    id: string;
    name: string;
    code: string;
}

interface Props {
    faculties: Faculty[];
    pendingRequests: PendingRequest[];
    departments: Department[];
    slug: string;
}

// ═══════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════

export default function FacultiesClient({
    faculties: initialFaculties,
    pendingRequests: initialPending,
    departments,
    slug,
}: Props) {
    const [faculties, setFaculties] = useState(initialFaculties.filter(f => f.is_approved));
    const [pending, setPending] = useState(initialPending);
    const [search, setSearch] = useState("");
    const [isPending, startTransition] = useTransition();

    const filteredFaculties = faculties.filter(f =>
        (f.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (f.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (f.department || "").toLowerCase().includes(search.toLowerCase())
    );

    // ── Approve / Reject / Remove ──
    function handleApprove(id: string, name: string) {
        startTransition(async () => {
            const result = await approveFacultyEnrollment(id, slug);
            if (result.error) { toast.error(result.error); }
            else { toast.success(`${name} approved`); setPending(prev => prev.filter(p => p.id !== id)); window.location.reload(); }
        });
    }

    function handleReject(id: string, name: string) {
        startTransition(async () => {
            const result = await rejectFacultyEnrollment(id, slug);
            if (result.error) { toast.error(result.error); }
            else { toast.success(`${name} rejected`); setPending(prev => prev.filter(p => p.id !== id)); }
        });
    }

    function handleRemove(id: string, name: string) {
        if (!confirm(`Remove ${name} from faculty? This will also remove all their subject assignments.`)) return;
        startTransition(async () => {
            const result = await removeFaculty(id, slug);
            if (result.error) { toast.error(result.error); }
            else { toast.success(`${name} removed`); setFaculties(prev => prev.filter(f => f.id !== id)); }
        });
    }

    // ── Create Dialog State ──
    const [createOpen, setCreateOpen] = useState(false);
    const [cFullName, setCFullName] = useState("");
    const [cEmail, setCEmail] = useState("");
    const [cPhone, setCPhone] = useState("");
    const [cDepartment, setCDepartment] = useState("");
    const [cEmployeeId, setCEmployeeId] = useState("");
    const [cPassword, setCPassword] = useState("");
    const [cAutoEmployeeId, setCAutoEmployeeId] = useState(true);
    const [previewEmpId, setPreviewEmpId] = useState("");

    useEffect(() => {
        if (cAutoEmployeeId) {
            previewNextEmployeeId(slug).then(r => {
                if ('number' in r && r.number) setPreviewEmpId(r.number);
            });
        }
    }, [cAutoEmployeeId, slug]);

    function resetCreateForm() {
        setCFullName(""); setCEmail(""); setCPhone(""); setCDepartment("");
        setCEmployeeId(""); setCPassword(""); setCAutoEmployeeId(true); setPreviewEmpId("");
    }

    function handleCreate() {
        if (!cFullName.trim() || !cEmail.trim() || !cPassword.trim()) {
            toast.error("Full name, email, and password are required.");
            return;
        }
        startTransition(async () => {
            const result = await createFaculty(slug, {
                full_name: cFullName,
                email: cEmail,
                phone: cPhone || undefined,
                department: cDepartment || undefined,
                employee_id: cAutoEmployeeId ? undefined : cEmployeeId || undefined,
                password: cPassword,
            });
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`Faculty created! Employee ID: ${result.employeeId}`);
                setCreateOpen(false);
                resetCreateForm();
                window.location.reload();
            }
        });
    }

    // ── Edit Dialog State ──
    const [editOpen, setEditOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Faculty | null>(null);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editDept, setEditDept] = useState("");
    const [editEmployeeId, setEditEmployeeId] = useState("");

    function openEditDialog(f: Faculty) {
        setEditTarget(f);
        setEditName(f.full_name);
        setEditEmail(f.email || "");
        setEditPhone(f.phone || "");
        setEditDept(f.department || "");
        setEditEmployeeId(f.admission_number || f.register_number || "");
        setEditOpen(true);
    }

    function handleEditSave() {
        if (!editTarget || !editName.trim()) return;
        startTransition(async () => {
            const result = await updateFaculty(slug, editTarget.id, {
                full_name: editName.trim(),
                email: editEmail.trim(),
                phone: editPhone.trim(),
                department: editDept.trim(),
                employee_id: editEmployeeId.trim(),
            });
            if (result.error) { toast.error(result.error); }
            else { toast.success("Faculty updated"); setEditOpen(false); window.location.reload(); }
        });
    }

    // ═══════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="h-6 w-6 text-emerald-500" />
                        Faculty Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create, manage, and approve faculty members.
                    </p>
                </div>
                <Button className="gap-2 rounded-xl" onClick={() => { resetCreateForm(); setCreateOpen(true); }}>
                    <UserPlus className="h-4 w-4" /> Add Faculty
                </Button>
            </div>

            {/* Stats Row */}
            <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm">
                    <Users className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">{faculties.length}</span>
                    <span className="text-muted-foreground">Active Faculty</span>
                </div>
                {pending.length > 0 && (
                    <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2 text-sm">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">{pending.length}</span>
                        <span className="text-muted-foreground">Pending Requests</span>
                    </div>
                )}
            </div>

            <Tabs defaultValue={pending.length > 0 ? "pending" : "active"}>
                <TabsList className="rounded-xl">
                    <TabsTrigger value="active" className="gap-2 rounded-lg">
                        <Users className="h-4 w-4" />
                        Active ({faculties.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="gap-2 rounded-lg">
                        <Clock className="h-4 w-4" />
                        Pending ({pending.length})
                    </TabsTrigger>
                </TabsList>

                {/* ── Active Faculty Tab ── */}
                <TabsContent value="active" className="space-y-4 mt-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search faculty..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 rounded-xl"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredFaculties.map((faculty) => (
                            <div
                                key={faculty.id}
                                className="group relative rounded-2xl border border-border/50 bg-card p-5 transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                                        <GraduationCap className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">{faculty.full_name}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                            <Mail className="h-3 w-3 shrink-0" />
                                            {faculty.email}
                                        </p>
                                        {faculty.department && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <BookOpen className="h-3 w-3 shrink-0" />
                                                {faculty.department}
                                            </p>
                                        )}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="gap-2" onClick={() => openEditDialog(faculty)}>
                                                <Pencil className="h-4 w-4" /> Edit Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive gap-2" onClick={() => handleRemove(faculty.id, faculty.full_name)}>
                                                <Trash2 className="h-4 w-4" /> Remove Faculty
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Assignments */}
                                {faculty.assignments.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-border/50">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Assignments</p>
                                        <div className="flex flex-wrap gap-1">
                                            {faculty.assignments.slice(0, 4).map((a) => (
                                                <Badge key={a.id} variant="secondary" className="text-[10px] rounded-md">
                                                    {a.subject?.code || "?"} → {a.class?.name || "?"}
                                                </Badge>
                                            ))}
                                            {faculty.assignments.length > 4 && (
                                                <Badge variant="outline" className="text-[10px] rounded-md">
                                                    +{faculty.assignments.length - 4} more
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Badge Row */}
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                        <BadgeCheck className="h-3 w-3" /> Faculty
                                    </span>
                                    {(faculty.admission_number || faculty.register_number) && (
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                            ID: {faculty.admission_number || faculty.register_number}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredFaculties.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                                {search ? "No faculty members match your search" : "No faculty members yet. Click \"Add Faculty\" to create one."}
                            </p>
                        </div>
                    )}
                </TabsContent>

                {/* ── Pending Requests Tab ── */}
                <TabsContent value="pending" className="space-y-4 mt-4">
                    {pending.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="h-12 w-12 text-emerald-500/30 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">No pending enrollment requests</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pending.map((req) => (
                                <div
                                    key={req.id}
                                    className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 transition-all hover:border-amber-500/40"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold">{req.full_name}</p>
                                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {req.email}</span>
                                            {req.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {req.phone}</span>}
                                            {req.department && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {req.department}</span>}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            Applied {new Date(req.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button size="sm" variant="outline" className="gap-1.5 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleReject(req.id, req.full_name)} disabled={isPending}>
                                            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />} Reject
                                        </Button>
                                        <Button size="sm" className="gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(req.id, req.full_name)} disabled={isPending}>
                                            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />} Approve
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* ═══════ Create Faculty Dialog ═══════ */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-emerald-500" /> Add New Faculty
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label>Full Name *</Label>
                            <Input value={cFullName} onChange={e => setCFullName(e.target.value)} placeholder="Faculty's full name" className="rounded-xl" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Email *</Label>
                                <Input type="email" value={cEmail} onChange={e => setCEmail(e.target.value)} placeholder="email@example.com" className="rounded-xl" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Phone</Label>
                                <Input value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="+91 9876543210" className="rounded-xl" />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Department</Label>
                            <select
                                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                                value={cDepartment}
                                onChange={e => setCDepartment(e.target.value)}
                            >
                                <option value="">— Select —</option>
                                {departments.map(d => <option key={d.id} value={d.name}>{d.name} ({d.code})</option>)}
                            </select>
                        </div>

                        {/* Employee ID */}
                        <div className="border-t border-border/50 pt-4 mt-1">
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label>Employee ID</Label>
                                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={cAutoEmployeeId}
                                            onChange={e => setCAutoEmployeeId(e.target.checked)}
                                            className="rounded"
                                        />
                                        Auto-generate
                                    </label>
                                </div>
                                {cAutoEmployeeId ? (
                                    <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 rounded-xl border border-border/50">
                                        <Hash className="h-4 w-4 text-emerald-500 shrink-0" />
                                        <span className="font-mono text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                            {previewEmpId || "Computing..."}
                                        </span>
                                    </div>
                                ) : (
                                    <Input value={cEmployeeId} onChange={e => setCEmployeeId(e.target.value)} placeholder="Enter employee ID" className="rounded-xl font-mono" />
                                )}
                            </div>
                        </div>

                        {/* Password */}
                        <div className="grid gap-2 border-t border-border/50 pt-4">
                            <Label className="flex items-center gap-1.5">
                                <KeyRound className="h-3.5 w-3.5" /> Default Password *
                            </Label>
                            <Input type="password" value={cPassword} onChange={e => setCPassword(e.target.value)} placeholder="Min 6 characters" className="rounded-xl" />
                            <p className="text-[10px] text-muted-foreground">Faculty will use this to log in initially.</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleCreate} disabled={isPending} className="gap-2">
                            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Create Faculty
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════ Edit Faculty Dialog ═══════ */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Edit Faculty Profile</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label>Full Name</Label>
                            <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Email</Label>
                                <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="rounded-xl" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Phone</Label>
                                <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="rounded-xl" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Department</Label>
                            <select
                                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                                value={editDept}
                                onChange={e => setEditDept(e.target.value)}
                            >
                                <option value="">— None —</option>
                                {departments.map(d => <option key={d.id} value={d.name}>{d.name} ({d.code})</option>)}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Employee ID</Label>
                            <Input value={editEmployeeId} onChange={e => setEditEmployeeId(e.target.value)} className="rounded-xl font-mono" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleEditSave} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
