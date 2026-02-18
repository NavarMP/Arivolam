"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, CheckCircle2 } from "lucide-react";

export default function CampusAcademicsPage() {
    const courses = [
        { name: "Software Engineering", code: "CS301", attendance: 85, assignments: 2, totalAssignments: 10, color: "bg-blue-500" },
        { name: "Web Programming", code: "CS302", attendance: 92, assignments: 8, totalAssignments: 8, color: "bg-green-500" },
        { name: "Data Structures", code: "CS303", attendance: 78, assignments: 5, totalAssignments: 10, color: "bg-orange-500" },
        { name: "Computer Networks", code: "CS304", attendance: 88, assignments: 3, totalAssignments: 5, color: "bg-purple-500" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Academics</h1>
                <p className="text-muted-foreground">Manage your courses, attendance, and assignments.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                    <Card key={course.code} className="transition-all hover:shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-bold">{course.name}</CardTitle>
                            <Badge variant="outline">{course.code}</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="mt-4 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Attendance</span>
                                        <span className={`font-bold ${course.attendance < 75 ? 'text-destructive' : 'text-green-600'}`}>{course.attendance}%</span>
                                    </div>
                                    <Progress value={course.attendance} className="h-2" />
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-3">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <span className="mt-1 text-xs text-muted-foreground">Assignments</span>
                                        <span className="text-lg font-bold">{course.assignments}/{course.totalAssignments}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-3">
                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                        <span className="mt-1 text-xs text-muted-foreground">Status</span>
                                        <span className="text-sm font-bold">Active</span>
                                    </div>
                                </div>

                                <Button className="w-full" variant="secondary">View Details</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
