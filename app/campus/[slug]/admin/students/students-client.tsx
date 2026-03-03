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
import { Plus, Loader2, GraduationCap, Search, X } from "lucide-react";
import { toast } from "sonner";
import { assignStudentClass, removeStudentClass } from "../academic-actions";

type StudentEnrollment = {
    id: string; full_name: string; email: string; register_number: string | null;
    admission_number: string | null; department: string | null;
};
type StudentClass = {
    id: string; roll_number: string | null; is_active: boolean;
    student: { id: string; full_name: string; email: string; register_number: string | null; admission_number: string | null; department: string | null } | null;
    class: { id: string; name: string; department: { id: string; name: string; code: string } | null } | null;
};
type ClassItem = { id: string; name: string; department: { id: string; name: string; code: string } | null; semester: { id: string; name: string } | null };

export default function StudentsClient({
    students, studentClasses: initialStudentClasses, classes, slug
}: {
    students: StudentEnrollment[]; studentClasses: StudentClass[]; classes: ClassItem[]; slug: string;
}) {
    const [studentClasses, setStudentClasses] = useState(initialStudentClasses);
    const [isPending, startTransition] = useTransition();
    const [assignOpen, setAssignOpen] = useState(false);
    const [search, setSearch] = useState("");

    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [selectedClassId, setSelectedClassId] = useState("");
    const [rollNumber, setRollNumber] = useState("");

    // Find students who aren't assigned yet
    const assignedStudentIds = new Set(studentClasses.map(sc => sc.student?.id).filter(Boolean));
    const unassignedStudents = students.filter(s => !assignedStudentIds.has(s.id));

    const filteredStudentClasses = studentClasses.filter(sc => {
        if (!search) return true;
        const term = search.toLowerCase();
        return (
            sc.student?.full_name?.toLowerCase().includes(term) ||
            sc.student?.register_number?.toLowerCase().includes(term) ||
            sc.student?.admission_number?.toLowerCase().includes(term) ||
            sc.class?.name?.toLowerCase().includes(term)
        );
    });

    const handleAssign = () => {
        if (!selectedStudentId || !selectedClassId) { toast.error("Student and class are required."); return; }
        startTransition(async () => {
            const result = await assignStudentClass(slug, { enrollment_id: selectedStudentId, class_id: selectedClassId, roll_number: rollNumber.trim() || undefined });
            if (result.error) { toast.error(result.error); } else {
                toast.success("Student assigned to class!"); setAssignOpen(false); window.location.reload();
            }
        });
    };

    const handleRemove = (id: string, studentName: string) => {
        if (!confirm(`Remove ${studentName} from their class?`)) return;
        startTransition(async () => {
            const result = await removeStudentClass(slug, id);
            if (result.error) { toast.error(result.error); } else {
                toast.success("Student removed from class."); setStudentClasses(prev => prev.filter(sc => sc.id !== id));
            }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <GraduationCap className="h-8 w-8 text-indigo-500" /> Students
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {students.length} enrolled students • {studentClasses.length} assigned to classes • {unassignedStudents.length} unassigned
                    </p>
                </div>
                <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2"><Plus className="h-4 w-4" /> Assign to Class</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Assign Student to Class</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Student *</Label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
                                    <option value="">— Select Student —</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.full_name} ({s.register_number || s.admission_number || s.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Class *</Label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                                    <option value="">— Select Class —</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.department ? ` (${c.department.code})` : ""}</option>)}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Roll Number</Label>
                                <Input placeholder="Optional roll number" value={rollNumber} onChange={e => setRollNumber(e.target.value)} />
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

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search students..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {filteredStudentClasses.length === 0 && studentClasses.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <GraduationCap className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold">No students assigned to classes</h3>
                        <p className="text-sm text-muted-foreground mt-1">Assign enrolled students to their classes.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filteredStudentClasses.map(sc => (
                        <Card key={sc.id} className="group hover:shadow-md transition-all">
                            <CardContent className="flex items-center justify-between py-4 px-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 font-bold text-sm">
                                        {sc.student?.full_name?.charAt(0) || "?"}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm">{sc.student?.full_name || "Unknown"}</h3>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            {sc.student?.register_number && <span>Reg: {sc.student.register_number}</span>}
                                            {sc.student?.admission_number && <span>Adm: {sc.student.admission_number}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <Badge variant="secondary">{sc.class?.name}</Badge>
                                        {sc.roll_number && <p className="text-xs text-muted-foreground mt-1">Roll: {sc.roll_number}</p>}
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleRemove(sc.id, sc.student?.full_name || "Student")}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
