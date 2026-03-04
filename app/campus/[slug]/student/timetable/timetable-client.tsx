"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users } from "lucide-react";

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

const DAYS = [
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
];

export default function TimetableClient({ entries }: { entries: TimetableEntry[] }) {

    // Extract unique periods from entries and sort them by start time
    const periods = useMemo(() => {
        const uniquePeriods = Array.from(new Map(entries.map(e => [e.period.id, e.period])).values());
        return uniquePeriods.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }, [entries]);

    const getEntryForCell = (dayOfWeek: number, periodId: string) => {
        return entries.find(e => e.day_of_week === dayOfWeek && e.period.id === periodId);
    };

    // Format time without seconds
    const formatTime = (timeString: string) => {
        return timeString.substring(0, 5);
    };

    if (entries.length === 0) {
        return (
            <Card>
                <CardContent className="h-48 flex flex-col items-center justify-center text-muted-foreground p-8">
                    <Clock className="h-10 w-10 mb-4 opacity-50" />
                    <p>No timetable defined for your class yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
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
                                                <span className="opacity-50 flex items-center justify-center gap-1 text-muted-foreground">
                                                    Break
                                                </span>
                                            </td>
                                        );
                                    }

                                    return (
                                        <td
                                            key={`${period.id}-${day.value}`}
                                            className={`border-b border-l p-1 relative transition-colors ${entry ? 'bg-primary/5' : ''}`}
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
                                                <div className="h-full min-h-[5rem] flex items-center justify-center">
                                                    <span className="text-muted-foreground opacity-30 text-xs">-</span>
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
