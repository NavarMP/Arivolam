"use client";

import { useState, useTransition } from "react";
import {
    Users,
    Search,
    MoreVertical,
    Mail,
    Phone,
    BadgeCheck,
    BookOpen,
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    Trash2,
    GraduationCap,
    Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { approveFacultyEnrollment, rejectFacultyEnrollment, removeFaculty } from "./actions";
import { updateMemberProfile } from "../users/actions";

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

interface Props {
    faculties: Faculty[];
    pendingRequests: PendingRequest[];
    slug: string;
}

export default function FacultiesClient({ faculties: initialFaculties, pendingRequests: initialPending, slug }: Props) {
    const [faculties, setFaculties] = useState(initialFaculties.filter(f => f.is_approved));
    const [pending, setPending] = useState(initialPending);
    const [search, setSearch] = useState("");
    const [isPending, startTransition] = useTransition();

    const filteredFaculties = faculties.filter(f =>
        (f.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (f.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (f.department || "").toLowerCase().includes(search.toLowerCase())
    );

    function handleApprove(id: string, name: string) {
        startTransition(async () => {
            const result = await approveFacultyEnrollment(id, slug);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${name} approved`);
                setPending(prev => prev.filter(p => p.id !== id));
                window.location.reload();
            }
        });
    }

    function handleReject(id: string, name: string) {
        startTransition(async () => {
            const result = await rejectFacultyEnrollment(id, slug);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${name} rejected`);
                setPending(prev => prev.filter(p => p.id !== id));
            }
        });
    }

    function handleRemove(id: string, name: string) {
        if (!confirm(`Remove ${name} from faculty? This will also remove all their subject assignments.`)) return;
        startTransition(async () => {
            const result = await removeFaculty(id, slug);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${name} removed`);
                setFaculties(prev => prev.filter(f => f.id !== id));
            }
        });
    }

    // ── Edit Dialog State ──
    const [editOpen, setEditOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Faculty | null>(null);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editDept, setEditDept] = useState("");

    function openEditDialog(f: Faculty) {
        setEditTarget(f);
        setEditName(f.full_name);
        setEditPhone(f.phone || "");
        setEditDept(f.department || "");
        setEditOpen(true);
    }

    function handleEditSave() {
        if (!editTarget || !editName.trim()) return;
        startTransition(async () => {
            const result = await updateMemberProfile(editTarget.id, slug, {
                full_name: editName.trim(),
                phone: editPhone.trim(),
                department: editDept.trim(),
            });
            if (result.error) { toast.error(result.error); }
            else { toast.success("Profile updated"); setEditOpen(false); window.location.reload(); }
        });
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Users className="h-6 w-6 text-emerald-500" />
                    Faculty Management
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage faculty members and approve enrollment requests.
                </p>
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
                                            <DropdownMenuItem
                                                className="gap-2"
                                                onClick={() => openEditDialog(faculty)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Edit Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive gap-2"
                                                onClick={() => handleRemove(faculty.id, faculty.full_name)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Remove Faculty
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
                                                <Badge
                                                    key={a.id}
                                                    variant="secondary"
                                                    className="text-[10px] rounded-md"
                                                >
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
                                        <BadgeCheck className="h-3 w-3" />
                                        Faculty
                                    </span>
                                    {faculty.admission_number && (
                                        <span className="text-[10px] text-muted-foreground">
                                            ID: {faculty.admission_number}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredFaculties.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">No faculty members found</p>
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
                                            <span className="flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {req.email}
                                            </span>
                                            {req.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {req.phone}
                                                </span>
                                            )}
                                            {req.department && (
                                                <span className="flex items-center gap-1">
                                                    <BookOpen className="h-3 w-3" />
                                                    {req.department}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            Applied {new Date(req.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1.5 rounded-lg text-destructive hover:bg-destructive/10"
                                            onClick={() => handleReject(req.id, req.full_name)}
                                            disabled={isPending}
                                        >
                                            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                                            Reject
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                                            onClick={() => handleApprove(req.id, req.full_name)}
                                            disabled={isPending}
                                        >
                                            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                            Approve
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* ── Edit Faculty Dialog ── */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Edit Faculty Profile</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label>Full Name</Label>
                            <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Phone</Label>
                            <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Department</Label>
                            <Input value={editDept} onChange={e => setEditDept(e.target.value)} className="rounded-xl" />
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
