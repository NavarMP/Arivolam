"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, GraduationCap, Building2, Users, BookOpen, Layers } from "lucide-react";
import { toast } from "sonner";
import { createDepartment, updateDepartment, deleteDepartment } from "../academic-actions";

type Department = {
    id: string;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    hod_enrollment_id: string | null;
    hod: { id: string; full_name: string; email: string } | null;
    created_at: string;
};

type Faculty = {
    id: string;
    full_name: string;
    email: string;
    department: string | null;
};

type DeptStats = Record<string, { classes: number; subjects: number; students: number; faculty: number }>;

export default function DepartmentsClient({ initialDepartments, faculties, stats, slug }: {
    initialDepartments: Department[];
    faculties: Faculty[];
    stats: DeptStats;
    slug: string;
}) {
    const [departments, setDepartments] = useState(initialDepartments);
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<Department | null>(null);

    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [hodId, setHodId] = useState("");

    const resetForm = () => {
        setName(""); setCode(""); setDescription(""); setHodId("");
        setEditItem(null);
    };

    const openCreate = () => {
        resetForm();
        setDialogOpen(true);
    };

    const openEdit = (dept: Department) => {
        setEditItem(dept);
        setName(dept.name);
        setCode(dept.code);
        setDescription(dept.description || "");
        setHodId(dept.hod_enrollment_id || "");
        setDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!name.trim() || !code.trim()) {
            toast.error("Name and code are required.");
            return;
        }
        startTransition(async () => {
            const formData = { name: name.trim(), code: code.trim(), description: description.trim(), hod_enrollment_id: hodId || undefined };
            const result = editItem
                ? await updateDepartment(slug, editItem.id, formData)
                : await createDepartment(slug, formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(editItem ? "Department updated!" : "Department created!");
                setDialogOpen(false);
                resetForm();
                window.location.reload();
            }
        });
    };

    const handleDelete = (id: string, depName: string) => {
        if (!confirm(`Delete department "${depName}"? This will also delete all associated classes, subjects, etc.`)) return;
        startTransition(async () => {
            const result = await deleteDepartment(slug, id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Department deleted.");
                setDepartments(prev => prev.filter(d => d.id !== id));
            }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-violet-500" />
                        Departments
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage academic departments for your institution.</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate} className="gap-2 rounded-xl">
                            <Plus className="h-4 w-4" /> Add Department
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editItem ? "Edit Department" : "Create Department"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="dept-name">Department Name *</Label>
                                <Input id="dept-name" placeholder="e.g., Computer Science" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="dept-code">Code *</Label>
                                <Input id="dept-code" placeholder="e.g., CS" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={10} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="dept-desc">Description</Label>
                                <Input id="dept-desc" placeholder="Brief description..." value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="dept-hod">Head of Department (HOD)</Label>
                                <select
                                    id="dept-hod"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    value={hodId}
                                    onChange={e => setHodId(e.target.value)}
                                >
                                    <option value="">— None —</option>
                                    {faculties.map(f => (
                                        <option key={f.id} value={f.id}>{f.full_name} ({f.email})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleSubmit} disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editItem ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Total Stats */}
            <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 rounded-xl bg-violet-500/10 px-4 py-2 text-sm">
                    <Building2 className="h-4 w-4 text-violet-500" />
                    <span className="font-medium">{departments.length}</span>
                    <span className="text-muted-foreground">Departments</span>
                </div>
            </div>

            {departments.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <GraduationCap className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold">No departments yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">Create your first department to get started.</p>
                        <Button className="mt-4 gap-2" onClick={openCreate}>
                            <Plus className="h-4 w-4" /> Add Department
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {departments.map(dept => {
                        const deptStats = stats[dept.id] || { classes: 0, subjects: 0, students: 0, faculty: 0 };
                        return (
                            <div key={dept.id} className="group relative rounded-2xl border border-border/50 bg-card p-5 transition-all hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-base font-semibold">{dept.name}</h3>
                                        <Badge variant="secondary" className="mt-1 font-mono text-xs">{dept.code}</Badge>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => openEdit(dept)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive" onClick={() => handleDelete(dept.id, dept.name)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {dept.description && (
                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{dept.description}</p>
                                )}

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground rounded-lg bg-muted/50 px-2.5 py-1.5">
                                        <Layers className="h-3 w-3 text-blue-500" />
                                        <span className="font-medium text-foreground">{deptStats.classes}</span> Classes
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground rounded-lg bg-muted/50 px-2.5 py-1.5">
                                        <BookOpen className="h-3 w-3 text-orange-500" />
                                        <span className="font-medium text-foreground">{deptStats.subjects}</span> Subjects
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground rounded-lg bg-muted/50 px-2.5 py-1.5">
                                        <GraduationCap className="h-3 w-3 text-emerald-500" />
                                        <span className="font-medium text-foreground">{deptStats.students}</span> Students
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground rounded-lg bg-muted/50 px-2.5 py-1.5">
                                        <Users className="h-3 w-3 text-violet-500" />
                                        <span className="font-medium text-foreground">{deptStats.faculty}</span> Faculty
                                    </div>
                                </div>

                                {/* HOD */}
                                {dept.hod && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border/50 pt-3 mt-3">
                                        <span className="font-medium text-foreground">HOD:</span>
                                        <span>{dept.hod.full_name}</span>
                                    </div>
                                )}

                                {!dept.is_active && (
                                    <Badge variant="destructive" className="mt-2 text-xs">Inactive</Badge>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
