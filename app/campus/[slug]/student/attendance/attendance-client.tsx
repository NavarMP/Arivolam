"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Check, X, Clock, AlertCircle } from "lucide-react";

type AttendanceRecord = {
    id: string; date: string; status: string; remarks: string | null;
    timetable_entry: {
        id: string;
        subject: { id: string; name: string; code: string } | null;
        period: { id: string; name: string; start_time: string; end_time: string } | null;
    } | null;
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    present: { label: "Present", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: Check },
    absent: { label: "Absent", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: X },
    late: { label: "Late", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
    od: { label: "OD", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: AlertCircle },
    leave: { label: "Leave", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", icon: AlertCircle },
};

export default function StudentAttendanceClient({ attendance }: { attendance: AttendanceRecord[] }) {
    // Calculate stats
    const total = attendance.length;
    const present = attendance.filter(a => a.status === "present").length;
    const absent = attendance.filter(a => a.status === "absent").length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    // Group by subject
    const bySubject = attendance.reduce((acc, a) => {
        const code = a.timetable_entry?.subject?.code || "Unknown";
        if (!acc[code]) acc[code] = { name: a.timetable_entry?.subject?.name || "Unknown", total: 0, present: 0 };
        acc[code].total++;
        if (a.status === "present" || a.status === "late") acc[code].present++;
        return acc;
    }, {} as Record<string, { name: string; total: number; present: number }>);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <CalendarCheck className="h-8 w-8 text-emerald-500" /> My Attendance
                </h1>
            </div>

            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="pt-6">
                        <p className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">{percentage}%</p>
                        <p className="text-sm text-emerald-600/70 dark:text-emerald-300/70">Overall Attendance</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-2xl font-bold">{total}</p>
                        <p className="text-xs text-muted-foreground">Total Classes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-2xl font-bold text-emerald-600">{present}</p>
                        <p className="text-xs text-muted-foreground">Present</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-2xl font-bold text-red-500">{absent}</p>
                        <p className="text-xs text-muted-foreground">Absent</p>
                    </CardContent>
                </Card>
            </div>

            {/* By Subject */}
            {Object.keys(bySubject).length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">By Subject</h2>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(bySubject).map(([code, info]) => {
                            const pct = info.total > 0 ? Math.round((info.present / info.total) * 100) : 0;
                            return (
                                <Card key={code}>
                                    <CardContent className="py-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-sm">{info.name}</h3>
                                                <Badge variant="secondary" className="mt-1 font-mono text-xs">{code}</Badge>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-lg font-bold ${pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-500"}`}>{pct}%</p>
                                                <p className="text-xs text-muted-foreground">{info.present}/{info.total}</p>
                                            </div>
                                        </div>
                                        {/* Progress bar */}
                                        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                                            <div className={`h-full rounded-full transition-all ${pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                                                style={{ width: `${pct}%` }} />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent Records */}
            <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Records</h2>
                {attendance.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <CalendarCheck className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <h3 className="text-lg font-semibold">No attendance records yet</h3>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {attendance.slice(0, 50).map(a => {
                            const config = statusConfig[a.status] || statusConfig.present;
                            const StatusIcon = config.icon;
                            return (
                                <Card key={a.id} className="hover:shadow-sm transition-all">
                                    <CardContent className="flex items-center justify-between py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold ${config.color}`}>
                                                <StatusIcon className="h-3.5 w-3.5" />
                                            </span>
                                            <div>
                                                <p className="font-medium text-sm">{a.timetable_entry?.subject?.name || "—"}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                    {a.timetable_entry?.period && ` • ${a.timetable_entry.period.name}`}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className={`text-xs ${config.color}`}>{config.label}</Badge>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
