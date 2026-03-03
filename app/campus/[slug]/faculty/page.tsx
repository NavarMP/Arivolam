import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CalendarCheck, BookOpen, FileText, ArrowRight } from "lucide-react";
import { FacultyWelcomeBanner } from "./components/faculty-welcome-banner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CampusFacultyPage({
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

    let facultyData: any = null;
    let enrollmentId: string | null = null;

    // Method 1: Check ERP session first
    if (erpSession && erpSession.institution_id === institution.id) {
        const { createClient: createServiceClient } = await import("@supabase/supabase-js");
        const serviceClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        );

        const { data: enrollment } = await serviceClient
            .from("enrollments")
            .select("*")
            .eq("id", erpSession.enrollment_id)
            .single();

        if (enrollment && (enrollment.role === "faculty" || enrollment.role === "admin")) {
            facultyData = enrollment;
            enrollmentId = enrollment.id;
        }
    }

    // Method 2: Fallback to Supabase Auth user
    if (!facultyData && user) {
        const { data: member } = await supabase
            .from("institution_members")
            .select("*")
            .eq("user_id", user.id)
            .eq("institution_id", institution.id)
            .single();

        if (member && (member.role === "faculty" || member.role === "admin")) {
            facultyData = {
                ...member,
                user_metadata: user.user_metadata,
                email: user.email,
            };
        }
    }

    if (!facultyData) {
        console.error("No faculty data found for user. Redirecting to campus root.");
        redirect(`/campus/${slug}`);
    }

    // 3. Fetch live data
    let myClassesCount = 0;
    let myExamsCount = 0;

    if (enrollmentId) {
        const { createClient: createServiceClient } = await import("@supabase/supabase-js");
        const sc = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        );

        const { count: classCount } = await sc
            .from("faculty_subjects")
            .select("*", { count: "exact", head: true })
            .eq("enrollment_id", enrollmentId)
            .eq("is_active", true);
        myClassesCount = classCount || 0;

        const { count: examCount } = await sc
            .from("exams")
            .select("*", { count: "exact", head: true })
            .eq("institution_id", institution.id);
        myExamsCount = examCount || 0;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Dynamic Banner */}
            <FacultyWelcomeBanner faculty={facultyData} institutionName={institution.name} />

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Subjects</CardTitle>
                        <BookOpen className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{myClassesCount}</div>
                        <p className="text-xs text-muted-foreground">Assigned subject-class pairs</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Exams Created</CardTitle>
                        <FileText className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{myExamsCount}</div>
                        <p className="text-xs text-muted-foreground">Total exams</p>
                    </CardContent>
                </Card>
                <Link href={`/campus/${slug}/faculty/attendance`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Mark Attendance</CardTitle>
                            <CalendarCheck className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                Go to Attendance <ArrowRight className="h-3 w-3" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href={`/campus/${slug}/faculty/marks`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">Enter Marks</CardTitle>
                            <FileText className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-1 text-sm font-medium text-blue-700 dark:text-blue-400">
                                Go to Marks Entry <ArrowRight className="h-3 w-3" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
