"use client";

import { useState, useTransition } from "react";
import {
    BookMarked, Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronRight,
    GraduationCap, BookOpen, Layers, Tag, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
    createCourse, updateCourse, deleteCourse,
    createCourseYear, deleteCourseYear, getCourseYears,
    getSyllabusEntries, addSyllabusEntry, removeSyllabusEntry,
} from "./actions";

type Department = { id: string; name: string; code: string };
type Subject = { id: string; name: string; code: string; department: any; semester: any };
type Semester = { id: string; name: string };
type Course = {
    id: string; department_id: string; name: string; code: string; short_name: string | null;
    duration_years: number; degree_type: string; description: string | null; is_active: boolean;
    department: Department | null;
};
type CourseYear = { id: string; course_id: string; year_number: number; name: string };
type SyllabusEntry = {
    id: string; subject: { id: string; name: string; code: string; credits: number; subject_type: string } | null;
    semester: { id: string; name: string } | null;
    is_elective: boolean; is_mandatory: boolean; notes: string | null;
};

interface Props {
    courses: Course[]; departments: Department[]; subjects: Subject[]; semesters: Semester[]; slug: string;
}

export default function CoursesClient({ courses: initial, departments, subjects, semesters, slug }: Props) {
    const [courses, setCourses] = useState(initial);
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<Course | null>(null);

    // Form state
    const [name, setName] = useState(""); const [code, setCode] = useState(""); const [shortName, setShortName] = useState("");
    const [deptId, setDeptId] = useState(""); const [duration, setDuration] = useState(4); const [degreeType, setDegreeType] = useState("undergraduate");
    const [desc, setDesc] = useState("");

    // Expanded course detail
    const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
    const [courseYears, setCourseYears] = useState<CourseYear[]>([]);
    const [syllabusMap, setSyllabusMap] = useState<Record<string, SyllabusEntry[]>>({});
    const [expandedYear, setExpandedYear] = useState<string | null>(null);

    // Add year dialog
    const [yearDialog, setYearDialog] = useState(false);
    const [yearNum, setYearNum] = useState(1); const [yearName, setYearName] = useState("First Year");
    const [yearCourseId, setYearCourseId] = useState("");

    // Add syllabus dialog
    const [syllabusDialog, setSyllabusDialog] = useState(false);
    const [syllabusYearId, setSyllabusYearId] = useState("");
    const [syllabusSubjectId, setSyllabusSubjectId] = useState("");
    const [syllabusSemesterId, setSyllabusSemesterId] = useState("");
    const [syllabusElective, setSyllabusElective] = useState(false);

    const resetForm = () => {
        setName(""); setCode(""); setShortName(""); setDeptId(""); setDuration(4); setDegreeType("undergraduate"); setDesc("");
        setEditItem(null);
    };

    const openCreate = () => { resetForm(); setDialogOpen(true); };
    const openEdit = (c: Course) => {
        setEditItem(c); setName(c.name); setCode(c.code); setShortName(c.short_name || "");
        setDeptId(c.department_id || (c.department?.id || "")); setDuration(c.duration_years);
        setDegreeType(c.degree_type); setDesc(c.description || ""); setDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!name.trim() || !code.trim() || !deptId) { toast.error("Name, code, and department are required."); return; }
        startTransition(async () => {
            const fd = { department_id: deptId, name: name.trim(), code: code.trim(), short_name: shortName.trim(), duration_years: duration, degree_type: degreeType, description: desc.trim() };
            const result = editItem ? await updateCourse(slug, editItem.id, fd) : await createCourse(slug, fd);
            if (result.error) { toast.error(result.error); } else { toast.success(editItem ? "Course updated!" : "Course created!"); setDialogOpen(false); resetForm(); window.location.reload(); }
        });
    };

    const handleDelete = (id: string, n: string) => {
        if (!confirm(`Delete course "${n}"? This removes all associated years and syllabus.`)) return;
        startTransition(async () => {
            const r = await deleteCourse(slug, id);
            if (r.error) toast.error(r.error); else { toast.success("Course deleted."); setCourses(prev => prev.filter(c => c.id !== id)); }
        });
    };

    // Toggle expanded course
    async function toggleCourse(courseId: string) {
        if (expandedCourse === courseId) { setExpandedCourse(null); return; }
        setExpandedCourse(courseId);
        try {
            const years = await getCourseYears(slug, courseId);
            setCourseYears(years);
            setExpandedYear(null);
        } catch { toast.error("Failed to load course years"); }
    }

    // Toggle expanded year → load syllabus
    async function toggleYear(yearId: string) {
        if (expandedYear === yearId) { setExpandedYear(null); return; }
        setExpandedYear(yearId);
        if (!syllabusMap[yearId]) {
            try {
                const entries = await getSyllabusEntries(slug, yearId);
                setSyllabusMap(prev => ({ ...prev, [yearId]: entries }));
            } catch { toast.error("Failed to load syllabus"); }
        }
    }

    // Add course year
    const openAddYear = (courseId: string) => { setYearCourseId(courseId); setYearNum(courseYears.length + 1); setYearName(`Year ${courseYears.length + 1}`); setYearDialog(true); };
    const handleAddYear = () => {
        startTransition(async () => {
            const r = await createCourseYear(slug, { course_id: yearCourseId, year_number: yearNum, name: yearName });
            if (r.error) toast.error(r.error); else { toast.success("Year added"); setYearDialog(false); const y = await getCourseYears(slug, yearCourseId); setCourseYears(y); }
        });
    };
    const handleDeleteYear = (id: string) => {
        if (!confirm("Delete this year and its syllabus?")) return;
        startTransition(async () => {
            const r = await deleteCourseYear(slug, id);
            if (r.error) toast.error(r.error); else { toast.success("Year deleted"); setCourseYears(prev => prev.filter(y => y.id !== id)); }
        });
    };

    // Add syllabus entry
    const openAddSyllabus = (yearId: string) => { setSyllabusYearId(yearId); setSyllabusSubjectId(""); setSyllabusSemesterId(""); setSyllabusElective(false); setSyllabusDialog(true); };
    const handleAddSyllabus = () => {
        if (!syllabusSubjectId) { toast.error("Select a subject"); return; }
        startTransition(async () => {
            const r = await addSyllabusEntry(slug, { course_year_id: syllabusYearId, subject_id: syllabusSubjectId, semester_id: syllabusSemesterId || undefined, is_elective: syllabusElective });
            if (r.error) toast.error(r.error); else {
                toast.success("Subject added to syllabus");
                setSyllabusDialog(false);
                const entries = await getSyllabusEntries(slug, syllabusYearId);
                setSyllabusMap(prev => ({ ...prev, [syllabusYearId]: entries }));
            }
        });
    };
    const handleRemoveSyllabus = (id: string, yearId: string) => {
        startTransition(async () => {
            const r = await removeSyllabusEntry(slug, id);
            if (r.error) toast.error(r.error); else {
                toast.success("Removed from syllabus");
                setSyllabusMap(prev => ({ ...prev, [yearId]: (prev[yearId] || []).filter(e => e.id !== id) }));
            }
        });
    };

    const degreeOptions = [
        { value: "undergraduate", label: "Undergraduate" }, { value: "postgraduate", label: "Postgraduate" },
        { value: "diploma", label: "Diploma" }, { value: "certificate", label: "Certificate" }, { value: "doctorate", label: "Doctorate" }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <BookMarked className="h-6 w-6 text-indigo-500" /> Courses & Syllabus
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage degree programs, course years, and syllabus mapping.</p>
                </div>
                <Button onClick={openCreate} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> Add Course</Button>
            </div>

            {/* Stats */}
            <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2 rounded-xl bg-indigo-500/10 px-4 py-2 text-sm">
                    <BookMarked className="h-4 w-4 text-indigo-500" />
                    <span className="font-medium">{courses.length}</span>
                    <span className="text-muted-foreground">Courses</span>
                </div>
            </div>

            {/* Course List */}
            {courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-border/50">
                    <GraduationCap className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold">No courses yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">Create your first degree program.</p>
                    <Button className="mt-4 gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Add Course</Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {courses.map(course => (
                        <div key={course.id} className="rounded-2xl border border-border/50 bg-card overflow-hidden transition-all hover:border-indigo-500/20">
                            {/* Course Header */}
                            <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => toggleCourse(course.id)}>
                                {expandedCourse === course.id ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-sm font-semibold">{course.name}</h3>
                                        <Badge variant="secondary" className="font-mono text-[10px]">{course.code}</Badge>
                                        {course.short_name && <Badge variant="outline" className="text-[10px]">{course.short_name}</Badge>}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                        {course.department && <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{course.department.name}</span>}
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration_years} years</span>
                                        <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{course.degree_type}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => openEdit(course)}><Pencil className="h-3.5 w-3.5" /></Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive" onClick={() => handleDelete(course.id, course.name)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                            </div>

                            {/* Expanded: Course Years */}
                            {expandedCourse === course.id && (
                                <div className="border-t border-border/50 bg-muted/30 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Course Years</p>
                                        <Button size="sm" variant="outline" className="gap-1.5 rounded-lg text-xs" onClick={() => openAddYear(course.id)}>
                                            <Plus className="h-3 w-3" /> Add Year
                                        </Button>
                                    </div>
                                    {courseYears.length === 0 ? (
                                        <p className="text-xs text-muted-foreground text-center py-4">No years defined. Add course years to map syllabus.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {courseYears.map(year => (
                                                <div key={year.id} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                                                    <div className="flex items-center gap-2 p-3 cursor-pointer" onClick={() => toggleYear(year.id)}>
                                                        {expandedYear === year.id ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                                                        <span className="text-sm font-medium flex-1">{year.name}</span>
                                                        <Badge variant="secondary" className="text-[10px]">Year {year.year_number}</Badge>
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 rounded text-destructive" onClick={e => { e.stopPropagation(); handleDeleteYear(year.id); }}><Trash2 className="h-3 w-3" /></Button>
                                                    </div>

                                                    {/* Expanded: Syllabus */}
                                                    {expandedYear === year.id && (
                                                        <div className="border-t border-border/30 p-3 bg-muted/20 space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Syllabus Subjects</p>
                                                                <Button size="sm" variant="outline" className="gap-1 rounded-lg text-[10px] h-7 px-2" onClick={() => openAddSyllabus(year.id)}>
                                                                    <Plus className="h-3 w-3" /> Add Subject
                                                                </Button>
                                                            </div>
                                                            {(syllabusMap[year.id] || []).length === 0 ? (
                                                                <p className="text-[10px] text-muted-foreground text-center py-3">No subjects mapped yet.</p>
                                                            ) : (
                                                                <div className="space-y-1">
                                                                    {(syllabusMap[year.id] || []).map(entry => (
                                                                        <div key={entry.id} className="flex items-center gap-2 rounded-lg bg-card border border-border/30 px-3 py-2">
                                                                            <BookOpen className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                                                            <div className="flex-1 min-w-0">
                                                                                <span className="text-xs font-medium">{entry.subject?.name || "?"}</span>
                                                                                <span className="text-[10px] text-muted-foreground ml-2">{entry.subject?.code}</span>
                                                                                {entry.semester && <Badge variant="outline" className="text-[8px] ml-2">{entry.semester.name}</Badge>}
                                                                                {entry.is_elective && <Badge variant="secondary" className="text-[8px] ml-1">Elective</Badge>}
                                                                            </div>
                                                                            <span className="text-[10px] text-muted-foreground">{entry.subject?.credits || 0} cr</span>
                                                                            <Button size="icon" variant="ghost" className="h-6 w-6 rounded text-destructive" onClick={() => handleRemoveSyllabus(entry.id, year.id)}>
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Create/Edit Course Dialog ── */}
            <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) resetForm(); }}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editItem ? "Edit Course" : "Create Course"}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label>Department *</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={deptId} onChange={e => setDeptId(e.target.value)}>
                                <option value="">Select department</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                            </select>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="grid gap-2"><Label>Course Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., B.Tech Computer Science" /></div>
                            <div className="grid gap-2"><Label>Code *</Label><Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g., BTECH-CS" maxLength={20} /></div>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div className="grid gap-2"><Label>Short Name</Label><Input value={shortName} onChange={e => setShortName(e.target.value)} placeholder="e.g., B.Tech CS" /></div>
                            <div className="grid gap-2"><Label>Duration (years)</Label><Input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={1} max={10} /></div>
                            <div className="grid gap-2">
                                <Label>Degree Type</Label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={degreeType} onChange={e => setDegreeType(e.target.value)}>
                                    {degreeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid gap-2"><Label>Description</Label><Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description..." /></div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleSubmit} disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editItem ? "Update" : "Create"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Add Year Dialog ── */}
            <Dialog open={yearDialog} onOpenChange={setYearDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Add Course Year</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2"><Label>Year Number</Label><Input type="number" value={yearNum} onChange={e => setYearNum(Number(e.target.value))} min={1} max={10} /></div>
                        <div className="grid gap-2"><Label>Year Name</Label><Input value={yearName} onChange={e => setYearName(e.target.value)} placeholder="e.g., First Year" /></div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleAddYear} disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add Year</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Add Syllabus Entry Dialog ── */}
            <Dialog open={syllabusDialog} onOpenChange={setSyllabusDialog}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Add Subject to Syllabus</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label>Subject *</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={syllabusSubjectId} onChange={e => setSyllabusSubjectId(e.target.value)}>
                                <option value="">Select subject</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Semester</Label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={syllabusSemesterId} onChange={e => setSyllabusSemesterId(e.target.value)}>
                                <option value="">— None —</option>
                                {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="elective" checked={syllabusElective} onChange={e => setSyllabusElective(e.target.checked)} className="rounded" />
                            <Label htmlFor="elective" className="text-sm">Elective subject</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleAddSyllabus} disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Add to Syllabus</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
