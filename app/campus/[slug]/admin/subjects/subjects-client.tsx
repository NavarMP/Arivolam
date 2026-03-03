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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Loader2, BookOpen, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { createSubject, updateSubject, deleteSubject, assignFacultySubject, removeFacultySubject } from "../academic-actions";

type Subject = {
    id: string; name: string; code: string; credits: number; subject_type: string;
    description: string | null; is_active: boolean;
    department: { id: string; name: string; code: string } | null;
    semester: { id: string; name: string } | null;
};
type Dept = { id: string; name: string; code: string };
type Sem = { id: string; name: string; number: number | null; academic_year: string | null };
type Faculty = { id: string; full_name: string; email: string; department: string | null };
type FacSubject = {
    id: string;
    faculty: { id: string; full_name: string; email: string } | null;
    subject: { id: string; name: string; code: string } | null;
    class: { id: string; name: string } | null;
};
type ClassItem = { id: string; name: string; department: { id: string; name: string; code: string } | null; semester: { id: string; name: string } | null };

export default function SubjectsClient({
    initialSubjects, departments, semesters, faculties, classes, facultySubjects, slug
}: {
    initialSubjects: Subject[]; departments: Dept[]; semesters: Sem[];
    faculties: Faculty[]; classes: ClassItem[]; facultySubjects: FacSubject[]; slug: string;
}) {
    const [subjects, setSubjects] = useState(initialSubjects);
    const [facSubs, setFacSubs] = useState(facultySubjects);
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [editItem, setEditItem] = useState<Subject | null>(null);

    // Subject form
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [deptId, setDeptId] = useState("");
    const [semId, setSemId] = useState("");
    const [credits, setCredits] = useState("3");
    const [subjectType, setSubjectType] = useState("theory");
    const [description, setDescription] = useState("");

    // Assignment form
    const [assignFacultyId, setAssignFacultyId] = useState("");
    const [assignSubjectId, setAssignSubjectId] = useState("");
    const [assignClassId, setAssignClassId] = useState("");

    const resetForm = () => { setName(""); setCode(""); setDeptId(""); setSemId(""); setCredits("3"); setSubjectType("theory"); setDescription(""); setEditItem(null); };
    const openCreate = () => { resetForm(); setDialogOpen(true); };
    const openEdit = (s: Subject) => {
        setEditItem(s); setName(s.name); setCode(s.code); setDeptId(s.department?.id || "");
        setSemId(s.semester?.id || ""); setCredits(s.credits.toString()); setSubjectType(s.subject_type);
        setDescription(s.description || ""); setDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!name.trim() || !code.trim() || !deptId) { toast.error("Name, code, and department are required."); return; }
        startTransition(async () => {
            const formData = { name: name.trim(), code: code.trim(), department_id: deptId, semester_id: semId || undefined, credits: parseInt(credits) || 3, subject_type: subjectType, description: description.trim() || undefined };
            const result = editItem
                ? await updateSubject(slug, editItem.id, formData)
                : await createSubject(slug, formData);
            if (result.error) { toast.error(result.error); } else {
                toast.success(editItem ? "Subject updated!" : "Subject created!");
                setDialogOpen(false); resetForm(); window.location.reload();
            }
        });
    };

    const handleDelete = (id: string, sName: string) => {
        if (!confirm(`Delete subject "${sName}"?`)) return;
        startTransition(async () => {
            const result = await deleteSubject(slug, id);
            if (result.error) { toast.error(result.error); } else {
                toast.success("Subject deleted."); setSubjects(prev => prev.filter(s => s.id !== id));
            }
        });
    };

    const handleAssign = () => {
        if (!assignFacultyId || !assignSubjectId || !assignClassId) { toast.error("All fields are required."); return; }
        startTransition(async () => {
            const result = await assignFacultySubject(slug, { enrollment_id: assignFacultyId, subject_id: assignSubjectId, class_id: assignClassId });
            if (result.error) { toast.error(result.error); } else {
                toast.success("Faculty assigned!"); setAssignOpen(false); window.location.reload();
            }
        });
    };

    const handleRemoveAssignment = (id: string) => {
        if (!confirm("Remove this faculty-subject assignment?")) return;
        startTransition(async () => {
            const result = await removeFacultySubject(slug, id);
            if (result.error) { toast.error(result.error); } else {
                toast.success("Assignment removed."); setFacSubs(prev => prev.filter(f => f.id !== id));
            }
        });
    };

    const typeColors: Record<string, string> = {
        theory: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        lab: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        elective: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        project: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <BookOpen className="h-8 w-8 text-blue-500" /> Subjects & Assignments
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage subjects/papers and assign them to faculty members.</p>
                </div>
            </div>

            <Tabs defaultValue="subjects" className="w-full">
                <TabsList>
                    <TabsTrigger value="subjects">Subjects ({subjects.length})</TabsTrigger>
                    <TabsTrigger value="assignments">Faculty Assignments ({facSubs.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="subjects" className="space-y-4 mt-4">
                    <div className="flex justify-end">
                        <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) resetForm(); }}>
                            <DialogTrigger asChild><Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Subject</Button></DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader><DialogTitle>{editItem ? "Edit Subject" : "Create Subject"}</DialogTitle></DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2"><Label>Subject Name *</Label><Input placeholder="e.g., Data Structures" value={name} onChange={e => setName(e.target.value)} /></div>
                                        <div className="grid gap-2"><Label>Code *</Label><Input placeholder="e.g., CS301" value={code} onChange={e => setCode(e.target.value.toUpperCase())} /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Department *</Label>
                                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={deptId} onChange={e => setDeptId(e.target.value)}>
                                                <option value="">— Select —</option>
                                                {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Semester</Label>
                                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={semId} onChange={e => setSemId(e.target.value)}>
                                                <option value="">— Any —</option>
                                                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="grid gap-2"><Label>Credits</Label><Input type="number" value={credits} onChange={e => setCredits(e.target.value)} /></div>
                                        <div className="grid gap-2 col-span-2">
                                            <Label>Type</Label>
                                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={subjectType} onChange={e => setSubjectType(e.target.value)}>
                                                <option value="theory">Theory</option>
                                                <option value="lab">Lab</option>
                                                <option value="elective">Elective</option>
                                                <option value="project">Project</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid gap-2"><Label>Description</Label><Input placeholder="Brief description..." value={description} onChange={e => setDescription(e.target.value)} /></div>
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

                    {subjects.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-semibold">No subjects yet</h3>
                                <p className="text-sm text-muted-foreground mt-1">Add subjects to start building your curriculum.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {subjects.map(sub => (
                                <Card key={sub.id} className="group hover:shadow-lg transition-all">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-base">{sub.name}</CardTitle>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <Badge variant="secondary" className="font-mono text-xs">{sub.code}</Badge>
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${typeColors[sub.subject_type] || "bg-gray-100 text-gray-800"}`}>{sub.subject_type}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(sub)}><Pencil className="h-3.5 w-3.5" /></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(sub.id, sub.name)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            {sub.department && <span>{sub.department.code}</span>}
                                            {sub.semester && <span>• {sub.semester.name}</span>}
                                            <span>• {sub.credits} credits</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="assignments" className="space-y-4 mt-4">
                    <div className="flex justify-end">
                        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                            <DialogTrigger asChild><Button className="gap-2"><UserPlus className="h-4 w-4" /> Assign Faculty</Button></DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Assign Faculty to Subject</DialogTitle></DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Faculty *</Label>
                                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={assignFacultyId} onChange={e => setAssignFacultyId(e.target.value)}>
                                            <option value="">— Select Faculty —</option>
                                            {faculties.map(f => <option key={f.id} value={f.id}>{f.full_name} ({f.email})</option>)}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Subject *</Label>
                                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={assignSubjectId} onChange={e => setAssignSubjectId(e.target.value)}>
                                            <option value="">— Select Subject —</option>
                                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Class *</Label>
                                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={assignClassId} onChange={e => setAssignClassId(e.target.value)}>
                                            <option value="">— Select Class —</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.department ? ` (${c.department.code})` : ""}</option>)}
                                        </select>
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

                    {facSubs.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <UserPlus className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-semibold">No assignments yet</h3>
                                <p className="text-sm text-muted-foreground mt-1">Assign faculty to subjects and classes.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {facSubs.map(fs => (
                                <Card key={fs.id} className="group hover:shadow-md transition-all">
                                    <CardContent className="flex items-center justify-between py-4 px-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-sm">
                                                {fs.faculty?.full_name?.charAt(0) || "?"}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-sm">{fs.faculty?.full_name || "Unknown"}</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {fs.subject?.name} ({fs.subject?.code}) • {fs.class?.name}
                                                </p>
                                            </div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleRemoveAssignment(fs.id)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
