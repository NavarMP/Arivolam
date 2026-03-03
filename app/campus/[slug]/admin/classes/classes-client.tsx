"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { createClass, updateClass, deleteClass } from "../academic-actions";

type Class = {
    id: string; name: string; section: string | null; max_students: number; is_active: boolean;
    department: { id: string; name: string; code: string } | null;
    semester: { id: string; name: string } | null;
    created_at: string;
};
type Dept = { id: string; name: string; code: string };
type Sem = { id: string; name: string; number: number | null; academic_year: string | null };

export default function ClassesClient({ initialClasses, departments, semesters, slug }: {
    initialClasses: Class[]; departments: Dept[]; semesters: Sem[]; slug: string;
}) {
    const [classes, setClasses] = useState(initialClasses);
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<Class | null>(null);
    const [name, setName] = useState("");
    const [section, setSection] = useState("");
    const [deptId, setDeptId] = useState("");
    const [semId, setSemId] = useState("");
    const [maxStudents, setMaxStudents] = useState("60");

    const resetForm = () => { setName(""); setSection(""); setDeptId(""); setSemId(""); setMaxStudents("60"); setEditItem(null); };
    const openCreate = () => { resetForm(); setDialogOpen(true); };
    const openEdit = (c: Class) => {
        setEditItem(c); setName(c.name); setSection(c.section || "");
        setDeptId(c.department?.id || ""); setSemId(c.semester?.id || "");
        setMaxStudents(c.max_students.toString()); setDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!name.trim() || !deptId || !semId) { toast.error("Name, department, and semester are required."); return; }
        startTransition(async () => {
            const formData = { name: name.trim(), department_id: deptId, semester_id: semId, section: section.trim() || undefined, max_students: parseInt(maxStudents) || 60 };
            const result = editItem
                ? await updateClass(slug, editItem.id, formData)
                : await createClass(slug, formData);
            if (result.error) { toast.error(result.error); } else {
                toast.success(editItem ? "Class updated!" : "Class created!");
                setDialogOpen(false); resetForm(); window.location.reload();
            }
        });
    };

    const handleDelete = (id: string, className: string) => {
        if (!confirm(`Delete class "${className}"? This will remove all associated timetable entries, attendance records, etc.`)) return;
        startTransition(async () => {
            const result = await deleteClass(slug, id);
            if (result.error) { toast.error(result.error); } else {
                toast.success("Class deleted."); setClasses(prev => prev.filter(c => c.id !== id));
            }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Users className="h-8 w-8 text-emerald-500" /> Classes
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage class sections for each department and semester.</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) resetForm(); }}>
                    <DialogTrigger asChild><Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Class</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{editItem ? "Edit Class" : "Create Class"}</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2"><Label>Class Name *</Label><Input placeholder="e.g., CS-A" value={name} onChange={e => setName(e.target.value)} /></div>
                            <div className="grid gap-2">
                                <Label>Department *</Label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={deptId} onChange={e => setDeptId(e.target.value)}>
                                    <option value="">— Select —</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Semester *</Label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={semId} onChange={e => setSemId(e.target.value)}>
                                    <option value="">— Select —</option>
                                    {semesters.map(s => <option key={s.id} value={s.id}>{s.name}{s.academic_year ? ` (${s.academic_year})` : ""}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Section</Label><Input placeholder="e.g., A" value={section} onChange={e => setSection(e.target.value)} /></div>
                                <div className="grid gap-2"><Label>Max Students</Label><Input type="number" value={maxStudents} onChange={e => setMaxStudents(e.target.value)} /></div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handleSubmit} disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editItem ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {classes.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold">No classes yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">Create departments and semesters first, then add classes.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {classes.map(cls => (
                        <Card key={cls.id} className="group hover:shadow-lg transition-all">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{cls.name}</CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            {cls.department && <Badge variant="secondary" className="text-xs">{cls.department.code}</Badge>}
                                            {cls.semester && <Badge variant="outline" className="text-xs">{cls.semester.name}</Badge>}
                                            {cls.section && <Badge variant="outline" className="text-xs">Sec {cls.section}</Badge>}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(cls)}><Pencil className="h-3.5 w-3.5" /></Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cls.id, cls.name)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Max: {cls.max_students} students</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
