"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, Award } from "lucide-react";

type ExamMark = {
    id: string; marks_obtained: number | null; is_absent: boolean;
    exam: {
        id: string; name: string; exam_type: string; max_marks: number; exam_date: string | null;
        subject: { id: string; name: string; code: string } | null;
    } | null;
};

const typeColors: Record<string, string> = {
    internal: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    external: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    assignment: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    seminar: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    project: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    lab: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
};

export default function StudentMarksClient({ marks }: { marks: ExamMark[] }) {
    // Group by subject
    const bySubject = marks.reduce((acc, m) => {
        const code = m.exam?.subject?.code || "Unknown";
        if (!acc[code]) acc[code] = { name: m.exam?.subject?.name || "Unknown", marks: [] };
        acc[code].marks.push(m);
        return acc;
    }, {} as Record<string, { name: string; marks: ExamMark[] }>);

    // Overall stats
    const totalExams = marks.length;
    const totalObtained = marks.reduce((sum, m) => sum + (m.marks_obtained || 0), 0);
    const totalMax = marks.reduce((sum, m) => sum + (m.exam?.max_marks || 0), 0);
    const overallPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Award className="h-8 w-8 text-amber-500" /> My Marks & Performance
                </h1>
            </div>

            {/* Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-900/10 border-amber-200 dark:border-amber-800">
                    <CardContent className="pt-6">
                        <p className="text-4xl font-bold text-amber-700 dark:text-amber-400">{overallPercentage}%</p>
                        <p className="text-sm text-amber-600/70 dark:text-amber-300/70">Overall Score</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-2xl font-bold">{totalExams}</p>
                        <p className="text-xs text-muted-foreground">Exams / Assessments</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-2xl font-bold">{totalObtained} / {totalMax}</p>
                        <p className="text-xs text-muted-foreground">Total Marks</p>
                    </CardContent>
                </Card>
            </div>

            {/* By Subject */}
            {Object.keys(bySubject).length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(bySubject).map(([code, info]) => (
                        <Card key={code}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base">{info.name}</CardTitle>
                                        <Badge variant="secondary" className="mt-1 font-mono text-xs">{code}</Badge>
                                    </div>
                                    <div className="text-right">
                                        {(() => {
                                            const subObtained = info.marks.reduce((s, m) => s + (m.marks_obtained || 0), 0);
                                            const subMax = info.marks.reduce((s, m) => s + (m.exam?.max_marks || 0), 0);
                                            const subPct = subMax > 0 ? Math.round((subObtained / subMax) * 100) : 0;
                                            return (
                                                <>
                                                    <p className={`text-lg font-bold ${subPct >= 60 ? "text-emerald-600" : subPct >= 40 ? "text-amber-600" : "text-red-500"}`}>{subPct}%</p>
                                                    <p className="text-xs text-muted-foreground">{subObtained}/{subMax}</p>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {info.marks.map(m => (
                                        <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${typeColors[m.exam?.exam_type || ""] || "bg-gray-100 text-gray-800"}`}>
                                                    {m.exam?.exam_type}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-medium">{m.exam?.name}</p>
                                                    {m.exam?.exam_date && <p className="text-xs text-muted-foreground">{new Date(m.exam.exam_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {m.is_absent ? (
                                                    <Badge variant="destructive" className="text-xs">Absent</Badge>
                                                ) : (
                                                    <p className="font-bold text-sm">
                                                        {m.marks_obtained ?? "—"} <span className="text-xs text-muted-foreground font-normal">/ {m.exam?.max_marks}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold">No published marks yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">Your marks will appear here once faculty publishes them.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
