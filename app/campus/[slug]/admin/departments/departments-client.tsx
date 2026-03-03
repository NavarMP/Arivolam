"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, GraduationCap, Building2 } from "lucide-react";
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

export default function DepartmentsClient({ initialDepartments, faculties, slug }: {
    initialDepartments: Department[];
    faculties: Faculty[];
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
                // Reload data
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
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-violet-500" />
                        Departments
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage academic departments for your institution.</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate} className="gap-2">
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
                    {departments.map(dept => (
                        <Card key={dept.id} className="group hover:shadow-lg transition-all border-border/60">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                                        <Badge variant="secondary" className="mt-1 font-mono text-xs">{dept.code}</Badge>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(dept)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(dept.id, dept.name)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {dept.description && (
                                    <p className="text-sm text-muted-foreground mb-3">{dept.description}</p>
                                )}
                                {dept.hod && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
                                        <span className="font-medium">HOD:</span>
                                        <span>{dept.hod.full_name}</span>
                                    </div>
                                )}
                                {!dept.is_active && (
                                    <Badge variant="destructive" className="mt-2 text-xs">Inactive</Badge>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
