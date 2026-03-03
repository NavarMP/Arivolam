"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Save, Loader2, FileText, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createExam, enterMarks, getClassStudents, getExamMarks, toggleExamPublish } from "../faculty-actions";

type ClassAssignment = {
    id: string;
    subject: { id: string; name: string; code: string } | null;
    class: { id: string; name: string } | null;
};

type Exam = {
    id: string; name: string; exam_type: string; max_marks: number; exam_date: string | null;
    is_published: boolean; weightage: number | null;
    subject: { id: string; name: string; code: string } | null;
    class: { id: string; name: string } | null;
};

type MarkEntry = {
    enrollment_id: string;
    name: string;
    register_number: string | null;
    marks: number | null;
    is_absent: boolean;
};

const EXAM_TYPES = [
    { value: "internal", label: "Internal" },
    { value: "external", label: "External" },
    { value: "assignment", label: "Assignment" },
    { value: "seminar", label: "Seminar" },
    { value: "project", label: "Project" },
    { value: "lab", label: "Lab" },
    { value: "other", label: "Other" },
];

export default function MarksClient({
    assignments, exams: initialExams, slug
}: {
    assignments: ClassAssignment[]; exams: Exam[]; slug: string;
}) {
    const [exams, setExams] = useState(initialExams);
    const [isPending, startTransition] = useTransition();
    const [createOpen, setCreateOpen] = useState(false);
    const [selectedExamId, setSelectedExamId] = useState("");
    const [markEntries, setMarkEntries] = useState<MarkEntry[]>([]);
    const [loadingMarks, setLoadingMarks] = useState(false);

    // Create exam form
    const [examName, setExamName] = useState("");
    const [examType, setExamType] = useState("internal");
    const [maxMarks, setMaxMarks] = useState("100");
    const [examDate, setExamDate] = useState("");
    const [examSubjectId, setExamSubjectId] = useState("");
    const [examClassId, setExamClassId] = useState("");

    // Load marks when an exam is selected
    useEffect(() => {
        if (!selectedExamId) { setMarkEntries([]); return; }
        const exam = exams.find(e => e.id === selectedExamId);
        if (!exam || !exam.class) return;

        setLoadingMarks(true);
        Promise.all([
            getClassStudents(slug, exam.class.id),
            getExamMarks(slug, selectedExamId),
        ]).then(([students, existingMarks]) => {
            const marksMap = new Map(existingMarks.map((m: any) => [m.student?.id, m]));
            setMarkEntries(students.map((s: any) => {
                const existing = marksMap.get(s.student?.id);
                return {
                    enrollment_id: s.student?.id || s.enrollment_id,
                    name: s.student?.full_name || "Unknown",
                    register_number: s.student?.register_number || null,
                    marks: existing?.marks_obtained ?? null,
                    is_absent: existing?.is_absent || false,
                };
            }));
            setLoadingMarks(false);
        }).catch(() => setLoadingMarks(false));
    }, [selectedExamId, slug, exams]);

    const handleCreateExam = () => {
        if (!examName.trim() || !examSubjectId || !examClassId) { toast.error("Name, subject, and class are required."); return; }
        startTransition(async () => {
            const result = await createExam(slug, {
                name: examName.trim(), exam_type: examType, max_marks: parseFloat(maxMarks) || 100,
                exam_date: examDate || undefined, subject_id: examSubjectId, class_id: examClassId,
            });
            if (result.error) { toast.error(result.error); } else {
                toast.success("Exam created!"); setCreateOpen(false); window.location.reload();
            }
        });
    };

    const handleSaveMarks = () => {
        startTransition(async () => {
            const result = await enterMarks(slug, selectedExamId, markEntries.map(m => ({
                student_enrollment_id: m.enrollment_id,
                marks_obtained: m.is_absent ? null : m.marks,
                is_absent: m.is_absent,
            })));
            if (result.error) { toast.error(result.error); } else {
                toast.success("Marks saved successfully!");
            }
        });
    };

    const handlePublish = (examId: string, publish: boolean) => {
        startTransition(async () => {
            const result = await toggleExamPublish(slug, examId, publish);
            if (result.error) { toast.error(result.error); } else {
                toast.success(publish ? "Marks published to students!" : "Marks hidden from students.");
                setExams(prev => prev.map(e => e.id === examId ? { ...e, is_published: publish } : e));
            }
        });
    };

    const updateMark = (enrollmentId: string, value: string) => {
        setMarkEntries(prev => prev.map(m =>
            m.enrollment_id === enrollmentId ? { ...m, marks: value === "" ? null : parseFloat(value) } : m
        ));
    };

    const toggleAbsent = (enrollmentId: string) => {
        setMarkEntries(prev => prev.map(m =>
            m.enrollment_id === enrollmentId ? { ...m, is_absent: !m.is_absent, marks: !m.is_absent ? null : m.marks } : m
        ));
    };

    const selectedExam = exams.find(e => e.id === selectedExamId);

    const typeColors: Record<string, string> = {
        internal: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        external: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        assignment: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        seminar: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        project: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        lab: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-500" /> Marks Entry
                    </h1>
                    <p className="text-muted-foreground mt-1">Create exams and enter student marks.</p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Create Exam</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create Exam</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2"><Label>Exam Name *</Label><Input placeholder="e.g., Internal Assessment 1" value={examName} onChange={e => setExamName(e.target.value)} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={examType} onChange={e => setExamType(e.target.value)}>
                                        {EXAM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="grid gap-2"><Label>Max Marks</Label><Input type="number" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} /></div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Subject *</Label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={examSubjectId} onChange={e => setExamSubjectId(e.target.value)}>
                                    <option value="">— Select —</option>
                                    {assignments.map(a => a.subject && <option key={a.id} value={a.subject.id}>{a.subject.name} ({a.subject.code})</option>)}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Class *</Label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={examClassId} onChange={e => setExamClassId(e.target.value)}>
                                    <option value="">— Select —</option>
                                    {assignments.map(a => a.class && <option key={a.id} value={a.class.id}>{a.class.name}</option>)}
                                </select>
                            </div>
                            <div className="grid gap-2"><Label>Exam Date</Label><Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} /></div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handleCreateExam} disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Exam List */}
                <div className="space-y-2">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your Exams</h2>
                    {exams.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-8 text-center text-sm text-muted-foreground">No exams yet. Create one to get started.</CardContent>
                        </Card>
                    ) : (
                        exams.map(exam => (
                            <Card key={exam.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedExamId === exam.id ? "ring-2 ring-primary" : ""}`}
                                onClick={() => setSelectedExamId(exam.id)}>
                                <CardContent className="py-3 px-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-sm">{exam.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${typeColors[exam.exam_type] || "bg-gray-100 text-gray-800"}`}>{exam.exam_type}</span>
                                                <span className="text-xs text-muted-foreground">{exam.subject?.code}</span>
                                                <span className="text-xs text-muted-foreground">• {exam.class?.name}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Badge variant="outline" className="text-[10px]">{exam.max_marks}</Badge>
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handlePublish(exam.id, !exam.is_published); }}>
                                                {exam.is_published ? <Eye className="h-3 w-3 text-emerald-500" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Marks Entry Area */}
                <div className="lg:col-span-2 space-y-4">
                    {selectedExam ? (
                        <>
                            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900/50">
                                <CardContent className="py-4">
                                    <h2 className="font-bold text-lg">{selectedExam.name}</h2>
                                    <p className="text-sm text-muted-foreground">{selectedExam.subject?.name} • {selectedExam.class?.name} • Max: {selectedExam.max_marks}</p>
                                </CardContent>
                            </Card>

                            {loadingMarks ? (
                                <Card><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
                            ) : markEntries.length > 0 ? (
                                <>
                                    <div className="space-y-2">
                                        {markEntries.map((entry, idx) => (
                                            <Card key={entry.enrollment_id} className="hover:shadow-sm transition-all">
                                                <CardContent className="flex items-center justify-between py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-muted-foreground w-6">{idx + 1}</span>
                                                        <div>
                                                            <p className="font-medium text-sm">{entry.name}</p>
                                                            {entry.register_number && <p className="text-xs text-muted-foreground">{entry.register_number}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox checked={entry.is_absent} onCheckedChange={() => toggleAbsent(entry.enrollment_id)} />
                                                            <Label className="text-xs">Absent</Label>
                                                        </div>
                                                        <Input
                                                            type="number"
                                                            className="w-20 text-center"
                                                            placeholder="—"
                                                            value={entry.marks ?? ""}
                                                            onChange={e => updateMark(entry.enrollment_id, e.target.value)}
                                                            disabled={entry.is_absent}
                                                            max={selectedExam.max_marks}
                                                            min={0}
                                                        />
                                                        <span className="text-xs text-muted-foreground">/ {selectedExam.max_marks}</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    <div className="flex justify-end">
                                        <Button onClick={handleSaveMarks} disabled={isPending} size="lg" className="gap-2">
                                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            Save Marks
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">No students in this class.</CardContent></Card>
                            )}
                        </>
                    ) : (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-semibold">Select an exam</h3>
                                <p className="text-sm text-muted-foreground mt-1">Choose an exam from the left to enter marks.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
