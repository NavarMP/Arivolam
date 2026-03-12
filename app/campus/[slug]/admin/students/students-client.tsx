"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Plus, Loader2, GraduationCap, Search, X, MoreVertical, Pencil, Trash2,
    Mail, Phone, BookOpen, CheckCircle, XCircle, Clock, UserPlus, Hash, KeyRound, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
    createStudent, updateStudent, deleteStudent,
    approveStudentEnrollment, rejectStudentEnrollment,
    previewNextAdmissionNumber, previewNextRegisterNumber,
} from "./actions";
import { assignStudentClass, removeStudentClass } from "../academic-actions";

// ═══════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════

type ClassAssignment = {
    id: string;
    enrollment_id: string;
    roll_number: string | null;
    class: {
        id: string;
        name: string;
        department: { id: string; name: string; code: string } | null;
    } | null;
};

type Student = {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    register_number: string | null;
    admission_number: string | null;
    department: string | null;
    is_approved: boolean;
    created_at: string;
    class_assignment: ClassAssignment | null;
};

type PendingStudent = {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    register_number: string | null;
    admission_number: string | null;
    department: string | null;
    created_at: string;
};

type Department = {
    id: string;
    name: string;
    code: string;
};

type ClassItem = {
    id: string;
    name: string;
    department: { id: string; name: string; code: string } | null;
    semester: { id: string; name: string } | null;
};

// ═══════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════

export default function StudentsClient({
    students: initialStudents,
    pendingStudents: initialPending,
    classes,
    departments,
    slug,
}: {
    students: Student[];
    pendingStudents: PendingStudent[];
    classes: ClassItem[];
    departments: Department[];
    slug: string;
}) {
    const [students, setStudents] = useState(initialStudents.filter(s => s.is_approved));
    const [pending, setPending] = useState(initialPending);
    const [search, setSearch] = useState("");
    const [isPending, startTransition] = useTransition();

    // Filter students
    const filteredStudents = students.filter((s) => {
        if (!search) return true;
        const term = search.toLowerCase();
        return (
            s.full_name?.toLowerCase().includes(term) ||
            s.email?.toLowerCase().includes(term) ||
            s.register_number?.toLowerCase().includes(term) ||
            s.admission_number?.toLowerCase().includes(term) ||
            s.department?.toLowerCase().includes(term) ||
            s.class_assignment?.class?.name?.toLowerCase().includes(term)
        );
    });

    // Stats
    const assignedCount = students.filter(s => s.class_assignment).length;
    const unassignedCount = students.length - assignedCount;

    // ── Create Dialog ──
    const [createOpen, setCreateOpen] = useState(false);
    const [cFullName, setCFullName] = useState("");
    const [cEmail, setCEmail] = useState("");
    const [cPhone, setCPhone] = useState("");
    const [cDepartment, setCDepartment] = useState("");
    const [cDeptCode, setCDeptCode] = useState("");
    const [cBatchYear, setCBatchYear] = useState(new Date().getFullYear().toString());
    const [cAdmissionNo, setCAdmissionNo] = useState("");
    const [cRegisterNo, setCRegisterNo] = useState("");
    const [cPassword, setCPassword] = useState("");
    const [cAutoAdmission, setCAutoAdmission] = useState(true);
    const [cAutoRegister, setCAutoRegister] = useState(true);
    const [previewAdm, setPreviewAdm] = useState("");
    const [previewReg, setPreviewReg] = useState("");

    // Auto-set dept code when department changes
    useEffect(() => {
        if (cDepartment) {
            const dept = departments.find(d => d.name === cDepartment || d.id === cDepartment);
            if (dept) setCDeptCode(dept.code);
        } else {
            setCDeptCode("");
        }
    }, [cDepartment, departments]);

    // Preview numbers
    useEffect(() => {
        if (cAutoAdmission && cDeptCode && cBatchYear) {
            previewNextAdmissionNumber(slug, cDeptCode, cBatchYear).then(r => {
                if ('number' in r && r.number) setPreviewAdm(r.number);
            });
        }
    }, [cAutoAdmission, cDeptCode, cBatchYear, slug]);

    useEffect(() => {
        if (cAutoRegister) {
            previewNextRegisterNumber(slug).then(r => {
                if ('number' in r && r.number) setPreviewReg(r.number);
            });
        }
    }, [cAutoRegister, slug]);

    function resetCreateForm() {
        setCFullName(""); setCEmail(""); setCPhone(""); setCDepartment("");
        setCDeptCode(""); setCBatchYear(new Date().getFullYear().toString());
        setCAdmissionNo(""); setCRegisterNo(""); setCPassword("");
        setCAutoAdmission(true); setCAutoRegister(true);
        setPreviewAdm(""); setPreviewReg("");
    }

    function handleCreate() {
        if (!cFullName.trim() || !cEmail.trim() || !cPassword.trim()) {
            toast.error("Full name, email, and password are required.");
            return;
        }
        startTransition(async () => {
            const result = await createStudent(slug, {
                full_name: cFullName,
                email: cEmail,
                phone: cPhone || undefined,
                department: cDepartment || undefined,
                dept_code: cDeptCode || undefined,
                batch_year: cBatchYear || undefined,
                admission_number: cAutoAdmission ? undefined : cAdmissionNo || undefined,
                register_number: cAutoRegister ? undefined : cRegisterNo || undefined,
                password: cPassword,
            });
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`Student created! Adm: ${result.admissionNumber}, Reg: ${result.registerNumber}`);
                setCreateOpen(false);
                resetCreateForm();
                window.location.reload();
            }
        });
    }

    // ── Edit Dialog ──
    const [editOpen, setEditOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Student | null>(null);
    const [eFullName, setEFullName] = useState("");
    const [eEmail, setEEmail] = useState("");
    const [ePhone, setEPhone] = useState("");
    const [eDepartment, setEDepartment] = useState("");
    const [eAdmissionNo, setEAdmissionNo] = useState("");
    const [eRegisterNo, setERegisterNo] = useState("");

    function openEditDialog(s: Student) {
        setEditTarget(s);
        setEFullName(s.full_name || "");
        setEEmail(s.email || "");
        setEPhone(s.phone || "");
        setEDepartment(s.department || "");
        setEAdmissionNo(s.admission_number || "");
        setERegisterNo(s.register_number || "");
        setEditOpen(true);
    }

    function handleEditSave() {
        if (!editTarget || !eFullName.trim()) return;
        startTransition(async () => {
            const result = await updateStudent(slug, editTarget.id, {
                full_name: eFullName,
                email: eEmail,
                phone: ePhone,
                department: eDepartment,
                admission_number: eAdmissionNo,
                register_number: eRegisterNo,
            });
            if (result.error) { toast.error(result.error); }
            else { toast.success("Student updated"); setEditOpen(false); window.location.reload(); }
        });
    }

    // ── Delete ──
    function handleDelete(id: string, name: string) {
        if (!confirm(`Delete ${name}? This will also remove their class assignments, attendance records, and exam marks. This action cannot be undone.`)) return;
        startTransition(async () => {
            const result = await deleteStudent(slug, id);
            if (result.error) { toast.error(result.error); }
            else {
                toast.success(`${name} deleted`);
                setStudents(prev => prev.filter(s => s.id !== id));
            }
        });
    }

    // ── Approve / Reject ──
    function handleApprove(id: string, name: string) {
        startTransition(async () => {
            const result = await approveStudentEnrollment(id, slug);
            if (result.error) { toast.error(result.error); }
            else {
                toast.success(`${name} approved`);
                setPending(prev => prev.filter(p => p.id !== id));
                window.location.reload();
            }
        });
    }
    function handleReject(id: string, name: string) {
        startTransition(async () => {
            const result = await rejectStudentEnrollment(id, slug);
            if (result.error) { toast.error(result.error); }
            else {
                toast.success(`${name} rejected`);
                setPending(prev => prev.filter(p => p.id !== id));
            }
        });
    }

    // ── Assign to Class ──
    const [assignOpen, setAssignOpen] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [selectedClassId, setSelectedClassId] = useState("");
    const [rollNumber, setRollNumber] = useState("");

    const unassignedStudents = students.filter(s => !s.class_assignment);

    function handleAssign() {
        if (!selectedStudentId || !selectedClassId) { toast.error("Student and class are required."); return; }
        startTransition(async () => {
            const result = await assignStudentClass(slug, { enrollment_id: selectedStudentId, class_id: selectedClassId, roll_number: rollNumber.trim() || undefined });
            if (result.error) { toast.error(result.error); }
            else { toast.success("Student assigned to class!"); setAssignOpen(false); window.location.reload(); }
        });
    }

    function handleRemoveClass(scId: string, studentName: string) {
        if (!confirm(`Remove ${studentName} from their class?`)) return;
        startTransition(async () => {
            const result = await removeStudentClass(slug, scId);
            if (result.error) { toast.error(result.error); }
            else { toast.success("Removed from class"); window.location.reload(); }
        });
    }

    // ═══════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <GraduationCap className="h-6 w-6 text-indigo-500" />
                        Student Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Create, manage, and assign students to classes.
                    </p>
                </div>
                <Button className="gap-2 rounded-xl" onClick={() => { resetCreateForm(); setCreateOpen(true); }}>
                    <UserPlus className="h-4 w-4" /> Add Student
                </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 rounded-xl bg-indigo-500/10 px-4 py-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-indigo-500" />
                    <span className="font-medium">{students.length}</span>
                    <span className="text-muted-foreground">Students</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm">
                    <BookOpen className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">{assignedCount}</span>
                    <span className="text-muted-foreground">Assigned</span>
                </div>
                {unassignedCount > 0 && (
                    <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2 text-sm">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">{unassignedCount}</span>
                        <span className="text-muted-foreground">Unassigned</span>
                    </div>
                )}
                {pending.length > 0 && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2 text-sm">
                        <Clock className="h-4 w-4 text-rose-500" />
                        <span className="font-medium">{pending.length}</span>
                        <span className="text-muted-foreground">Pending</span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue={pending.length > 0 ? "pending" : "all"}>
                <TabsList className="rounded-xl">
                    <TabsTrigger value="all" className="gap-2 rounded-lg">
                        <GraduationCap className="h-4 w-4" /> All Students ({students.length})
                    </TabsTrigger>
                    <TabsTrigger value="classes" className="gap-2 rounded-lg">
                        <BookOpen className="h-4 w-4" /> Class Assignments
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="gap-2 rounded-lg">
                        <Clock className="h-4 w-4" /> Pending ({pending.length})
                    </TabsTrigger>
                </TabsList>

                {/* ── Tab 1: All Students ── */}
                <TabsContent value="all" className="space-y-4 mt-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search students..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 rounded-xl"
                        />
                    </div>

                    {filteredStudents.length === 0 ? (
                        <div className="text-center py-16">
                            <GraduationCap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                                {search ? "No students match your search" : "No students yet. Click \"Add Student\" to create one."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredStudents.map((student) => (
                                <div
                                    key={student.id}
                                    className="group relative rounded-2xl border border-border/50 bg-card p-5 transition-all hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 font-bold text-sm">
                                            {student.full_name?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">{student.full_name}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                                <Mail className="h-3 w-3 shrink-0" /> {student.email}
                                            </p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="gap-2" onClick={() => openEditDialog(student)}>
                                                    <Pencil className="h-4 w-4" /> Edit Student
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive gap-2" onClick={() => handleDelete(student.id, student.full_name)}>
                                                    <Trash2 className="h-4 w-4" /> Delete Student
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* IDs & Department */}
                                    <div className="mt-3 space-y-1">
                                        {student.admission_number && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Hash className="h-3 w-3 shrink-0" />
                                                <span className="font-mono">Adm: {student.admission_number}</span>
                                            </div>
                                        )}
                                        {student.register_number && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Hash className="h-3 w-3 shrink-0" />
                                                <span className="font-mono">Reg: {student.register_number}</span>
                                            </div>
                                        )}
                                        {student.department && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <BookOpen className="h-3 w-3 shrink-0" />
                                                {student.department}
                                            </div>
                                        )}
                                    </div>

                                    {/* Class Assignment Badge */}
                                    <div className="mt-3 flex items-center justify-between">
                                        {student.class_assignment?.class ? (
                                            <Badge variant="secondary" className="text-[10px] rounded-md">
                                                {student.class_assignment.class.name}
                                                {student.class_assignment.roll_number && ` • Roll: ${student.class_assignment.roll_number}`}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[10px] rounded-md text-amber-600 border-amber-500/30">
                                                Unassigned
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ── Tab 2: Class Assignments ── */}
                <TabsContent value="classes" className="space-y-4 mt-4">
                    <div className="flex justify-end">
                        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2 rounded-xl">
                                    <Plus className="h-4 w-4" /> Assign to Class
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Assign Student to Class</DialogTitle></DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Student *</Label>
                                        <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
                                            <option value="">— Select Student —</option>
                                            {unassignedStudents.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.full_name} ({s.admission_number || s.register_number || s.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Class *</Label>
                                        <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                                            <option value="">— Select Class —</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.department ? ` (${c.department.code})` : ""}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Roll Number</Label>
                                        <Input placeholder="Optional roll number" value={rollNumber} onChange={e => setRollNumber(e.target.value)} className="rounded-xl" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                    <Button onClick={handleAssign} disabled={isPending}>
                                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Assign
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {students.filter(s => s.class_assignment).length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">No students assigned to classes yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {students.filter(s => s.class_assignment).map(s => (
                                <Card key={s.id} className="group hover:shadow-md transition-all">
                                    <CardContent className="flex items-center justify-between py-4 px-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 font-bold text-sm">
                                                {s.full_name?.charAt(0) || "?"}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-sm">{s.full_name}</h3>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {s.admission_number && <span>Adm: {s.admission_number}</span>}
                                                    {s.register_number && <span>Reg: {s.register_number}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <Badge variant="secondary">{s.class_assignment!.class?.name}</Badge>
                                                {s.class_assignment!.roll_number && <p className="text-xs text-muted-foreground mt-1">Roll: {s.class_assignment!.roll_number}</p>}
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveClass(s.class_assignment!.id, s.full_name)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ── Tab 3: Pending ── */}
                <TabsContent value="pending" className="space-y-4 mt-4">
                    {pending.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="h-12 w-12 text-emerald-500/30 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">No pending student requests</p>
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
                                            {req.admission_number && <span className="font-mono">Adm: {req.admission_number}</span>}
                                            {req.register_number && <span className="font-mono">Reg: {req.register_number}</span>}
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

            {/* ═══════ Create Student Dialog ═══════ */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-indigo-500" /> Add New Student
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        {/* Name */}
                        <div className="grid gap-2">
                            <Label>Full Name *</Label>
                            <Input value={cFullName} onChange={e => setCFullName(e.target.value)} placeholder="Student's full name" className="rounded-xl" />
                        </div>

                        {/* Email & Phone */}
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

                        {/* Department & Batch Year */}
                        <div className="grid grid-cols-2 gap-3">
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
                            <div className="grid gap-2">
                                <Label>Batch Year</Label>
                                <Input value={cBatchYear} onChange={e => setCBatchYear(e.target.value)} placeholder="2026" className="rounded-xl" />
                            </div>
                        </div>

                        <div className="border-t border-border/50 pt-4 mt-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Identification Numbers</p>

                            {/* Admission Number */}
                            <div className="grid gap-2 mb-3">
                                <div className="flex items-center justify-between">
                                    <Label>Admission Number</Label>
                                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={cAutoAdmission}
                                            onChange={e => setCAutoAdmission(e.target.checked)}
                                            className="rounded"
                                        />
                                        Auto-generate
                                    </label>
                                </div>
                                {cAutoAdmission ? (
                                    <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 rounded-xl border border-border/50">
                                        <Hash className="h-4 w-4 text-indigo-500 shrink-0" />
                                        <span className="font-mono text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                            {previewAdm || (cDeptCode ? "Computing..." : "Select department first")}
                                        </span>
                                    </div>
                                ) : (
                                    <Input value={cAdmissionNo} onChange={e => setCAdmissionNo(e.target.value)} placeholder="Enter manually" className="rounded-xl font-mono" />
                                )}
                            </div>

                            {/* Register Number */}
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label>Register Number</Label>
                                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={cAutoRegister}
                                            onChange={e => setCAutoRegister(e.target.checked)}
                                            className="rounded"
                                        />
                                        Auto-generate
                                    </label>
                                </div>
                                {cAutoRegister ? (
                                    <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/50 rounded-xl border border-border/50">
                                        <Hash className="h-4 w-4 text-emerald-500 shrink-0" />
                                        <span className="font-mono text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                            {previewReg || "Computing..."}
                                        </span>
                                    </div>
                                ) : (
                                    <Input value={cRegisterNo} onChange={e => setCRegisterNo(e.target.value)} placeholder="Enter manually" className="rounded-xl font-mono" />
                                )}
                            </div>
                        </div>

                        {/* Password */}
                        <div className="grid gap-2 border-t border-border/50 pt-4">
                            <Label className="flex items-center gap-1.5">
                                <KeyRound className="h-3.5 w-3.5" /> Default Password *
                            </Label>
                            <Input type="password" value={cPassword} onChange={e => setCPassword(e.target.value)} placeholder="Min 6 characters" className="rounded-xl" />
                            <p className="text-[10px] text-muted-foreground">Student will use this to log in initially.</p>
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleCreate} disabled={isPending} className="gap-2">
                            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Create Student
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══════ Edit Student Dialog ═══════ */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label>Full Name</Label>
                            <Input value={eFullName} onChange={e => setEFullName(e.target.value)} className="rounded-xl" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Email</Label>
                                <Input type="email" value={eEmail} onChange={e => setEEmail(e.target.value)} className="rounded-xl" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Phone</Label>
                                <Input value={ePhone} onChange={e => setEPhone(e.target.value)} className="rounded-xl" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Department</Label>
                            <select
                                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                                value={eDepartment}
                                onChange={e => setEDepartment(e.target.value)}
                            >
                                <option value="">— None —</option>
                                {departments.map(d => <option key={d.id} value={d.name}>{d.name} ({d.code})</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label>Admission No.</Label>
                                <Input value={eAdmissionNo} onChange={e => setEAdmissionNo(e.target.value)} className="rounded-xl font-mono" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Register No.</Label>
                                <Input value={eRegisterNo} onChange={e => setERegisterNo(e.target.value)} className="rounded-xl font-mono" />
                            </div>
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
