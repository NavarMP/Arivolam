"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar as CalendarIcon, Clock, Users, X, Plus } from "lucide-react";
import { getTimetableEntries, saveTimetableEntry, deleteTimetableEntry, getFacultySubjects } from "../academic-actions";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Types based on the returned joined data
type Class = { id: string; name: string; department: { name: string } };
type Period = { id: string; name: string; start_time: string; end_time: string; is_break: boolean };
type Subject = { id: string; name: string; code: string; subject_type: string };
type FacultySubject = { id: string; faculty: { id: string; full_name: string } };

type TimetableEntry = {
    id: string;
    class_id: string;
    subject_id: string;
    period_id: string;
    day_of_week: number;
    room: string | null;
    faculty_subject_id: string | null;
    subject: Subject;
    period: Period;
    faculty_subject: FacultySubject | null;
};

// Available faculty subjects for a class
type AvailableFacultySubject = {
    id: string;
    class_id: string;
    subject: Subject;
    faculty: { id: string; full_name: string };
};

const DAYS = [
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
];

export default function TimetableClient({ classes, periods, slug }: { classes: Class[], periods: Period[], slug: string }) {
    const [selectedClassId, setSelectedClassId] = useState<string>("");

    const [entries, setEntries] = useState<TimetableEntry[]>([]);
    const [allFacultySubjects, setAllFacultySubjects] = useState<AvailableFacultySubject[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [existingEntry, setExistingEntry] = useState<TimetableEntry | null>(null);

    // Form State
    const [formSubjectId, setFormSubjectId] = useState<string>("");
    const [formFacultySubjectId, setFormFacultySubjectId] = useState<string>("none");
    const [formRoom, setFormRoom] = useState<string>("");

    // Load faculty subjects (assignments) for dropdowns
    useEffect(() => {
        async function loadFacultySubjects() {
            try {
                const data = await getFacultySubjects(slug);
                setAllFacultySubjects(data as any);
            } catch (e: any) {
                toast.error(e.message);
            }
        }
        loadFacultySubjects();
    }, [slug]);

    // Load timetable when class changes
    useEffect(() => {
        if (!selectedClassId) {
            setEntries([]);
            return;
        }

        async function loadTimetable() {
            setIsLoading(true);
            try {
                const data = await getTimetableEntries(slug, selectedClassId);
                setEntries(data as any);
            } catch (error: any) {
                toast.error(error.message || "Failed to load timetable");
            } finally {
                setIsLoading(false);
            }
        }

        loadTimetable();
    }, [selectedClassId, slug]);

    // Derived data for the selected class's faculty assignments
    const availableAssignmentsForClass = allFacultySubjects.filter(fs => fs.class_id === selectedClassId);

    // Grid Helpers
    const getEntryForCell = (dayOfWeek: number, periodId: string) => {
        return entries.find(e => e.day_of_week === dayOfWeek && e.period_id === periodId);
    };

    const handleCellClick = (period: Period, dayIndex: number) => {
        if (!selectedClassId || period.is_break) return;

        const entry = getEntryForCell(dayIndex, period.id);

        setSelectedPeriod(period);
        setSelectedDay(dayIndex);
        setExistingEntry(entry || null);

        if (entry) {
            setFormSubjectId(entry.subject_id);
            setFormFacultySubjectId(entry.faculty_subject_id || "none");
            setFormRoom(entry.room || "");
        } else {
            setFormSubjectId("");
            setFormFacultySubjectId("none");
            setFormRoom("");
        }

        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!selectedClassId || !selectedPeriod || selectedDay === null || !formSubjectId) {
            toast.error("Please fill in all required fields");
            return;
        }

        const loadId = toast.loading("Saving entry...");
        try {
            const result = await saveTimetableEntry(slug, {
                class_id: selectedClassId,
                period_id: selectedPeriod.id,
                day_of_week: selectedDay,
                subject_id: formSubjectId,
                faculty_subject_id: formFacultySubjectId === "none" ? undefined : formFacultySubjectId,
                room: formRoom,
            });

            if (result.error) throw new Error(result.error);

            toast.success("Timetable entry saved", { id: loadId });
            setIsDialogOpen(false);

            // Reload
            const data = await getTimetableEntries(slug, selectedClassId);
            setEntries(data as any);
        } catch (error: any) {
            toast.error(error.message, { id: loadId });
        }
    };

    const handleDelete = async () => {
        if (!existingEntry) return;

        const loadId = toast.loading("Removing entry...");
        try {
            const result = await deleteTimetableEntry(slug, existingEntry.id);
            if (result.error) throw new Error(result.error);

            toast.success("Entry removed", { id: loadId });
            setIsDialogOpen(false);

            // Reload
            setEntries(entries.filter(e => e.id !== existingEntry.id));
        } catch (error: any) {
            toast.error(error.message, { id: loadId });
        }
    };

    // Auto-select subject based on faculty assignment
    const handleFacultyAssignmentChange = (val: string) => {
        setFormFacultySubjectId(val);
        if (val !== "none") {
            const fs = availableAssignmentsForClass.find(a => a.id === val);
            if (fs) {
                setFormSubjectId(fs.subject.id);
            }
        }
    };

    // Format time without seconds
    const formatTime = (timeString: string) => {
        return timeString.substring(0, 5);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-4 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            <CardTitle>Class Schedule</CardTitle>
                        </div>
                        <div className="w-full sm:w-72">
                            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a class..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name} ({c.department.name})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>

                {selectedClassId ? (
                    <CardContent className="p-0 overflow-x-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                            </div>
                        ) : (
                            periods.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    No periods defined. Go to Academic Setup &gt; Periods to create them.
                                </div>
                            ) : (
                                <table className="w-full border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-muted/50">
                                            <th className="border-b border-r p-3 text-left font-medium text-sm w-32 bg-background sticky left-0 z-10">
                                                Time \ Day
                                            </th>
                                            {DAYS.map(day => (
                                                <th key={day.value} className="border-b p-3 font-medium text-sm text-center">
                                                    {day.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {periods.map((period) => (
                                            <tr key={period.id} className={period.is_break ? "bg-muted/30" : "hover:bg-muted/10 transition-colors"}>
                                                <td className="border-b border-r p-3 text-sm font-medium bg-background sticky left-0 z-10">
                                                    <div className="flex flex-col">
                                                        <span>{period.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatTime(period.start_time)} - {formatTime(period.end_time)}
                                                        </span>
                                                    </div>
                                                </td>
                                                {DAYS.map((day) => {
                                                    const entry = getEntryForCell(day.value, period.id);

                                                    if (period.is_break) {
                                                        return (
                                                            <td key={`${period.id}-${day.value}`} className="border-b border-l-0 p-3 text-center text-sm bg-muted/20">
                                                                <span className="opacity-50 flex items-center justify-center gap-1">
                                                                    Break
                                                                </span>
                                                            </td>
                                                        );
                                                    }

                                                    return (
                                                        <td
                                                            key={`${period.id}-${day.value}`}
                                                            className={`border-b border-l p-1 relative group cursor-pointer transition-colors
                                                                ${entry ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'}
                                                            `}
                                                            onClick={() => handleCellClick(period, day.value)}
                                                        >
                                                            {entry ? (
                                                                <div className="h-full flex flex-col p-2 rounded-md border border-primary/20 bg-background/50 backdrop-blur-sm min-h-[5rem]">
                                                                    <div className="font-semibold text-sm text-primary leading-tight line-clamp-2">
                                                                        {entry.subject.name}
                                                                    </div>
                                                                    <div className="text-xs font-medium text-muted-foreground mt-1">
                                                                        {entry.subject.code}
                                                                    </div>
                                                                    {entry.faculty_subject && (
                                                                        <div className="text-xs mt-auto pt-1 flex items-center gap-1 text-muted-foreground truncate">
                                                                            <Users className="h-3 w-3 shrink-0" />
                                                                            <span className="truncate">{entry.faculty_subject.faculty.full_name}</span>
                                                                        </div>
                                                                    )}
                                                                    {entry.room && (
                                                                        <div className="text-xs mt-0.5 text-muted-foreground opacity-80">
                                                                            Room: {entry.room}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="h-full min-h-[5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hocus:text-primary">
                                                                        <Plus className="h-4 w-4 mr-1" /> Assign
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}
                    </CardContent>
                ) : (
                    <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
                        Select a class to view and edit its timetable
                    </CardContent>
                )}
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{existingEntry ? 'Edit' : 'Add'} Timetable Entry</DialogTitle>
                        <DialogDescription>
                            {selectedPeriod?.name} ({selectedPeriod && formatTime(selectedPeriod.start_time)} - {selectedPeriod && formatTime(selectedPeriod.end_time)})
                            <br />
                            {DAYS.find(d => d.value === selectedDay)?.label}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="faculty">Faculty Assignment (Optional)</Label>
                            <Select value={formFacultySubjectId} onValueChange={handleFacultyAssignmentChange}>
                                <SelectTrigger id="faculty">
                                    <SelectValue placeholder="Select faculty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No specific faculty (Subject only)</SelectItem>
                                    {availableAssignmentsForClass.map((fs) => (
                                        <SelectItem key={fs.id} value={fs.id}>
                                            {fs.faculty.full_name} - {fs.subject.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">Selecting a faculty will auto-fill the subject.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="subject">Subject *</Label>
                            <Select value={formSubjectId} onValueChange={setFormSubjectId}
                                disabled={formFacultySubjectId !== "none"}>
                                <SelectTrigger id="subject" className={formFacultySubjectId !== "none" ? "bg-muted" : ""}>
                                    <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* Ideally we load all subjects here, but for now we extract unique subjects from assignments */}
                                    {/* We will just allow selection if no faculty is picked, but we need the subject list. */}
                                    {/* Fallback: extract subjects from available assignments. */}
                                    {Array.from(new Map(availableAssignmentsForClass.map(fs => [fs.subject.id, fs.subject])).values()).map((sub) => (
                                        <SelectItem key={sub.id} value={sub.id}>
                                            {sub.name} ({sub.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="room">Room / Location (Optional)</Label>
                            <Input
                                id="room"
                                value={formRoom}
                                onChange={(e) => setFormRoom(e.target.value)}
                                placeholder="e.g. Room 301, Lab 2"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
                        {existingEntry ? (
                            <Button variant="destructive" onClick={handleDelete} type="button">
                                Remove Entry
                            </Button>
                        ) : (
                            <div /> // Spacer
                        )}
                        <Button type="button" onClick={handleSave}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

