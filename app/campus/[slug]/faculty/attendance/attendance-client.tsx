"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, Loader2, Users, Clock, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { getClassStudents, getAttendanceForEntry, markAttendance } from "../faculty-actions";

type ClassAssignment = {
    id: string;
    subject: { id: string; name: string; code: string; subject_type: string } | null;
    class: { id: string; name: string; section: string | null; department: { id: string; name: string; code: string } | null; semester: { id: string; name: string } | null } | null;
};

type TimetableEntry = {
    id: string; day_of_week: number; room: string | null;
    class: { id: string; name: string } | null;
    subject: { id: string; name: string; code: string } | null;
    period: { id: string; name: string; start_time: string; end_time: string; sort_order: number } | null;
};

type Period = {
    id: string; name: string; start_time: string; end_time: string; sort_order: number;
};

type StudentRecord = {
    enrollment_id: string;
    name: string;
    register_number: string | null;
    status: "present" | "absent" | "late" | "od" | "leave" | "unmarked";
};

const STATUS_OPTIONS = [
    { value: "present", label: "P", color: "bg-emerald-500 text-white" },
    { value: "absent", label: "A", color: "bg-red-500 text-white" },
    { value: "late", label: "L", color: "bg-amber-500 text-white" },
    { value: "od", label: "OD", color: "bg-blue-500 text-white" },
    { value: "leave", label: "LV", color: "bg-gray-500 text-white" },
    { value: "unmarked", label: "-", color: "bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AttendanceClient({
    assignments, timetableEntries, periods, slug
}: {
    assignments: ClassAssignment[];
    timetableEntries: TimetableEntry[];
    periods: Period[];
    slug: string;
}) {
    const [isPending, startTransition] = useTransition();
    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedEntryId, setSelectedEntryId] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [loading, setLoading] = useState(false);

    // Get unique classes from assignments
    const uniqueClasses = Array.from(
        new Map(assignments.map(a => [a.class?.id, a.class])).values()
    ).filter(Boolean);

    // Filter timetable entries for selected class on the selected day
    const [y, m, d] = date.split('-').map(Number);
    const selectedDay = new Date(y, m - 1, d).getDay();
    const relevantEntries = timetableEntries.filter(
        te => te.class?.id === selectedClassId && te.day_of_week === selectedDay
    ).sort((a, b) => (a.period?.sort_order || 0) - (b.period?.sort_order || 0));

    // Reset entry id if it's no longer valid for the selected date
    useEffect(() => {
        if (selectedEntryId && !relevantEntries.find(te => te.id === selectedEntryId)) {
            setSelectedEntryId("");
        }
    }, [date, selectedClassId]);

    // Load students and attendance when class/entry/date changes
    useEffect(() => {
        if (!selectedClassId) { setStudents([]); return; }
        let isCurrent = true;
        setLoading(true);

        Promise.all([
            getClassStudents(slug, selectedClassId),
            selectedEntryId ? getAttendanceForEntry(slug, selectedEntryId, date) : Promise.resolve([])
        ]).then(([studentsData, attendanceData]: any) => {
            if (!isCurrent) return;

            const attMap = new Map();
            attendanceData.forEach((a: any) => {
                attMap.set(a.student?.id || a.student?.enrollment_id, a.status);
            });

            setStudents(studentsData.map((s: any) => {
                const enrollmentId = s.student?.id || s.enrollment_id;
                return {
                    enrollment_id: enrollmentId,
                    name: s.student?.full_name || "Unknown",
                    register_number: s.student?.register_number || s.roll_number || null,
                    status: attMap.get(enrollmentId) || "unmarked" as const,
                };
            }));
            setLoading(false);
        }).catch(() => {
            if (isCurrent) setLoading(false);
        });

        return () => { isCurrent = false; };
    }, [selectedClassId, selectedEntryId, date, slug]);

    const updateStatus = (enrollmentId: string, status: string) => {
        setStudents(prev => prev.map(s =>
            s.enrollment_id === enrollmentId ? { ...s, status: status as any } : s
        ));
    };

    const markAllPresent = () => {
        setStudents(prev => prev.map(s => ({ ...s, status: "present" })));
    };

    const markAllAbsent = () => {
        setStudents(prev => prev.map(s => ({ ...s, status: "absent" })));
    };

    const clearAll = () => {
        if (confirm("Are you sure you want to clear all attendance marks?")) {
            setStudents(prev => prev.map(s => ({ ...s, status: "unmarked" })));
        }
    };

    const handleSubmit = () => {
        if (!selectedEntryId || !date || students.length === 0) {
            toast.error("Please select a class, period, and date.");
            return;
        }

        const unmarked = students.filter(s => s.status === "unmarked").length;
        if (unmarked > 0) {
            if (unmarked < students.length) {
                toast.error(`Please mark attendance for all students. ${unmarked} students are still unmarked.`);
                return;
            }
            if (!confirm(`Are you sure you want to CLEAR all attendance records for this period?`)) {
                return;
            }
        } else {
            if (!confirm("Are you sure you want to submit the attendance for this class?")) {
                return;
            }
        }

        const validRecords = students.filter(s => s.status !== "unmarked");

        startTransition(async () => {
            const result = await markAttendance(slug, {
                timetable_entry_id: selectedEntryId,
                date,
                records: validRecords.map(s => ({
                    student_enrollment_id: s.enrollment_id,
                    status: s.status,
                })),
            });
            if (result.error) { toast.error(result.error); } else {
                if (validRecords.length === 0) {
                    toast.success("Attendance cleared successfully.");
                } else {
                    toast.success(`Attendance marked for ${validRecords.length} students!`);
                }
            }
        });
    };

    const formatTime = (t: string) => {
        const [h, m] = t.split(":");
        const hour = parseInt(h);
        return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
    };

    const presentCount = students.filter(s => s.status === "present").length;
    const absentCount = students.filter(s => s.status === "absent").length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <CalendarCheck className="h-8 w-8 text-emerald-500" /> Mark Attendance
                </h1>
                <p className="text-muted-foreground mt-1">Mark attendance for your classes by period.</p>
            </div>

            {/* Selection Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                    <Label>Date</Label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    <p className="text-xs text-muted-foreground">{DAYS[new Date(date).getDay()]}</p>
                </div>
                <div className="grid gap-2">
                    <Label>Class</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setSelectedEntryId(""); }}>
                        <option value="">— Select Class —</option>
                        {uniqueClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.department ? ` (${c.department.code})` : ""}</option>)}
                    </select>
                </div>
                <div className="grid gap-2">
                    <Label>Period</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedEntryId} onChange={e => setSelectedEntryId(e.target.value)} disabled={!selectedClassId}>
                        <option value="">— Select Period —</option>
                        {relevantEntries.map(te => (
                            <option key={te.id} value={te.id}>
                                {te.period?.name} ({formatTime(te.period?.start_time || "")} - {formatTime(te.period?.end_time || "")}) — {te.subject?.code}
                            </option>
                        ))}
                        {/* Also allow selecting from all periods if no timetable */}
                        {relevantEntries.length === 0 && periods.map(p => (
                            <option key={p.id} value={p.id} disabled>
                                {p.name} ({formatTime(p.start_time)} - {formatTime(p.end_time)}) — No timetable entry
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Student List */}
            {loading ? (
                <Card><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
            ) : students.length > 0 && selectedEntryId ? (
                <div className="space-y-4">
                    {/* Summary Bar */}
                    <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 border-emerald-100 dark:border-emerald-900/50">
                        <CardContent className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
                                    <p className="text-xs text-muted-foreground">Present</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-red-500">{absentCount}</p>
                                    <p className="text-xs text-muted-foreground">Absent</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-muted-foreground">{students.filter(s => s.status === "unmarked").length}</p>
                                    <p className="text-xs text-muted-foreground">Unmarked</p>
                                </div>
                            </div>
                            <div className="flex gap-2 items-center flex-wrap justify-end">
                                <Button variant="outline" size="sm" onClick={markAllPresent}>All Present</Button>
                                <Button variant="outline" size="sm" onClick={markAllAbsent}>All Absent</Button>
                                <Button variant="ghost" size="sm" onClick={clearAll} className="text-red-500 hover:text-red-600 hover:bg-red-50">Clear</Button>
                                <Button onClick={handleSubmit} disabled={isPending || !selectedEntryId} size="sm" className="gap-2 ml-2">
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    Submit
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Student Rows */}
                    <div className="space-y-2">
                        {students.map((student, idx) => (
                            <Card key={student.enrollment_id} className="hover:shadow-sm transition-all">
                                <CardContent className="flex items-center justify-between py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground w-6">{idx + 1}</span>
                                        <div>
                                            <p className="font-medium text-sm">{student.name}</p>
                                            {student.register_number && <p className="text-xs text-muted-foreground">{student.register_number}</p>}
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5">
                                        {STATUS_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => updateStatus(student.enrollment_id, opt.value)}
                                                className={`h-8 w-8 rounded-full text-xs font-bold transition-all ${student.status === opt.value ? opt.color + " scale-110 shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ) : selectedClassId && !selectedEntryId ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold">Select a Period</h3>
                        <p className="text-sm text-muted-foreground">Please select a time period to mark attendance.</p>
                    </CardContent>
                </Card>
            ) : selectedClassId ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold">No students in this class</h3>
                        <p className="text-sm text-muted-foreground">Ask the admin to assign students to this class.</p>
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}
