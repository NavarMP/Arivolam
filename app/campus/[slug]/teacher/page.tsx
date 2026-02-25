import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CalendarCheck, BookOpen } from "lucide-react";
import { TeacherWelcomeBanner } from "./components/teacher-welcome-banner";
import { redirect } from "next/navigation";

export default async function CampusTeacherPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();

    // 1. Get Institution Info
    const { data: institution } = await supabase
        .from("institutions")
        .select("id, name")
        .eq("slug", slug)
        .single();

    if (!institution) return <div>Institution not found</div>;

    // 2. Resolve User Identity
    const { data: { user } } = await supabase.auth.getUser();
    const erpSession = await getSession();

    let staffData: any = null;

    if (user) {
        // Find them in institution_members
        const { data: member } = await supabase
            .from("institution_members")
            .select("*")
            .eq("user_id", user.id)
            .eq("institution_id", institution.id)
            .single();

        if (member && (member.role === "staff" || member.role === "admin")) {
            staffData = {
                ...member,
                user_metadata: user.user_metadata,
                email: user.email,
            };
        }
    } else if (erpSession && erpSession.institution_id === institution.id) {
        // Fetch from enrollments based on ERP session
        const { data: enrollment } = await supabase
            .from("enrollments")
            .select("*")
            .eq("id", erpSession.enrollment_id)
            .single();

        if (enrollment && (enrollment.role === "staff" || enrollment.role === "admin")) {
            staffData = enrollment;
        }
    }

    if (!staffData) {
        redirect(`/campus/${slug}`);
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Dynamic Banner */}
            <TeacherWelcomeBanner teacher={staffData} institutionName={institution.name} />

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
                        <Clock className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-muted-foreground">Not configured</div>
                        <p className="text-xs text-muted-foreground">Timetable module not active</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                        <CalendarCheck className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-muted-foreground">None</div>
                        <p className="text-xs text-muted-foreground">Assignment module not active</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-muted-foreground">Not available</div>
                        <p className="text-xs text-muted-foreground">Attendance module not active</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Quick Post</CardTitle>
                        <BookOpen className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mt-2">Create Notice &rarr;</div>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-300/70">Broadcast to your dept</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader>
                        <CardTitle>Teaching Roster</CardTitle>
                        <CardDescription>Your schedule for today.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-t border-dashed bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="text-center space-y-2">
                            <Clock className="h-8 w-8 text-slate-300 mx-auto" />
                            <p className="text-sm text-slate-500">Timetable module is currently offline.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 border-emerald-100 dark:border-emerald-900/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>Department Activity</CardTitle>
                        <CardDescription>Recent updates within {staffData.department || "your department"}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center py-8 text-center">
                            <div className="space-y-2">
                                <BookOpen className="h-8 w-8 text-slate-300 mx-auto" />
                                <p className="text-sm text-muted-foreground">No recent activity</p>
                                <p className="text-xs text-muted-foreground/60">Department updates will appear here</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
