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
import { Plus, Pencil, Trash2, Loader2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { createSemester, updateSemester, deleteSemester } from "../academic-actions";

type Semester = {
    id: string; name: string; number: number | null; academic_year: string | null;
    start_date: string | null; end_date: string | null; is_active: boolean; created_at: string;
};

export default function SemestersClient({ initialSemesters, slug }: { initialSemesters: Semester[]; slug: string }) {
    const [semesters, setSemesters] = useState(initialSemesters);
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<Semester | null>(null);
    const [name, setName] = useState("");
    const [number, setNumber] = useState("");
    const [academicYear, setAcademicYear] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const resetForm = () => { setName(""); setNumber(""); setAcademicYear(""); setStartDate(""); setEndDate(""); setEditItem(null); };

    const openCreate = () => { resetForm(); setDialogOpen(true); };
    const openEdit = (s: Semester) => {
        setEditItem(s); setName(s.name); setNumber(s.number?.toString() || "");
        setAcademicYear(s.academic_year || ""); setStartDate(s.start_date || ""); setEndDate(s.end_date || "");
        setDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!name.trim()) { toast.error("Name is required."); return; }
        startTransition(async () => {
            const formData = { name: name.trim(), number: number ? parseInt(number) : undefined, academic_year: academicYear.trim() || undefined, start_date: startDate || undefined, end_date: endDate || undefined };
            const result = editItem
                ? await updateSemester(slug, editItem.id, formData)
                : await createSemester(slug, formData);
            if (result.error) { toast.error(result.error); } else {
                toast.success(editItem ? "Semester updated!" : "Semester created!");
                setDialogOpen(false); resetForm(); window.location.reload();
            }
        });
    };

    const handleDelete = (id: string, semName: string) => {
        if (!confirm(`Delete semester "${semName}"? This may affect classes and subjects.`)) return;
        startTransition(async () => {
            const result = await deleteSemester(slug, id);
            if (result.error) { toast.error(result.error); } else {
                toast.success("Semester deleted."); setSemesters(prev => prev.filter(s => s.id !== id));
            }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <CalendarDays className="h-8 w-8 text-blue-500" /> Semesters
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage academic semesters and terms.</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Semester</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{editItem ? "Edit Semester" : "Create Semester"}</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2"><Label>Name *</Label><Input placeholder="e.g., Semester 1" value={name} onChange={e => setName(e.target.value)} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Number</Label><Input type="number" placeholder="1" value={number} onChange={e => setNumber(e.target.value)} /></div>
                                <div className="grid gap-2"><Label>Academic Year</Label><Input placeholder="e.g., 2025-2026" value={academicYear} onChange={e => setAcademicYear(e.target.value)} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Start Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                                <div className="grid gap-2"><Label>End Date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handleSubmit} disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editItem ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {semesters.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold">No semesters yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">Create your first semester to organize classes and subjects.</p>
                        <Button className="mt-4 gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Add Semester</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {semesters.map(sem => (
                        <Card key={sem.id} className="group hover:shadow-lg transition-all border-border/60">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{sem.name}</CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                            {sem.number && <Badge variant="secondary" className="text-xs">#{sem.number}</Badge>}
                                            {sem.academic_year && <Badge variant="outline" className="text-xs">{sem.academic_year}</Badge>}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(sem)}><Pencil className="h-3.5 w-3.5" /></Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(sem.id, sem.name)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {(sem.start_date || sem.end_date) && (
                                    <p className="text-xs text-muted-foreground">{sem.start_date} — {sem.end_date || "Ongoing"}</p>
                                )}
                                {!sem.is_active && <Badge variant="destructive" className="mt-2 text-xs">Inactive</Badge>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
