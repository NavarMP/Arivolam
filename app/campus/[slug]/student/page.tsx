import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, BookOpen, AlertCircle } from "lucide-react";
import { StudentWelcomeBanner } from "./components/student-welcome-banner";
import { redirect } from "next/navigation";

export default async function CampusStudentPage({
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

    let studentData: any = null;

    if (user) {
        // Find them in institution_members
        const { data: member } = await supabase
            .from("institution_members")
            .select("*")
            .eq("user_id", user.id)
            .eq("institution_id", institution.id)
            .single();

        if (member && member.role === "student") {
            studentData = {
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

        if (enrollment && enrollment.role === "student") {
            studentData = enrollment;
        }
    }

    if (!studentData) {
        redirect(`/campus/${slug}`);
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Dynamic Banner */}
            <StudentWelcomeBanner student={studentData} institutionName={institution.name} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                        <Clock className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-muted-foreground">Not available</div>
                        <p className="text-xs text-muted-foreground">Attendance module not active</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Assignments</CardTitle>
                        <BookOpen className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-muted-foreground">None</div>
                        <p className="text-xs text-muted-foreground">Assignment module not active</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Next Class</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-muted-foreground">Not configured</div>
                        <p className="text-xs text-muted-foreground">Timetable module not active</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Announcements</CardTitle>
                        <AlertCircle className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-indigo-700 dark:text-indigo-400">None yet</div>
                        <p className="text-xs text-indigo-600/70 dark:text-indigo-300/70">No announcements posted</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader>
                        <CardTitle>Today&apos;s Timetable</CardTitle>
                        <CardDescription>Your schedule structure is being initialized.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-t border-dashed bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="text-center space-y-2">
                            <Calendar className="h-8 w-8 text-slate-300 mx-auto" />
                            <p className="text-sm text-slate-500">Timetable module is currently offline.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest updates from Arivolam.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center py-8 text-center">
                            <div className="space-y-2">
                                <AlertCircle className="h-8 w-8 text-slate-300 mx-auto" />
                                <p className="text-sm text-muted-foreground">No recent activity</p>
                                <p className="text-xs text-muted-foreground/60">Updates will appear here as they happen</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
