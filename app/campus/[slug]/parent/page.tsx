import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Activity, FileText, Calendar, Bell } from "lucide-react";
import { ParentWelcomeBanner } from "./components/parent-welcome-banner";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CampusParentPage({
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

    let parentData: any = null;

    if (user) {
        // Find them in institution_members
        const { data: member } = await supabase
            .from("institution_members")
            .select("*")
            .eq("user_id", user.id)
            .eq("institution_id", institution.id)
            .single();

        if (member && member.role === "parent") {
            parentData = {
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

        if (enrollment && enrollment.role === "parent") {
            parentData = enrollment;
        }
    }

    if (!parentData) {
        redirect(`/campus/${slug}`);
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Dynamic Banner */}
            <ParentWelcomeBanner parent={parentData} institutionName={institution.name} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Linked Student</CardTitle>
                        <User className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-orange-600 truncate">Not linked</div>
                        <p className="text-xs text-muted-foreground">Contact admin to link your child</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                        <Activity className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-muted-foreground">Not available</div>
                        <p className="text-xs text-muted-foreground">Requires student link</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Fee Status</CardTitle>
                        <FileText className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-muted-foreground">Not configured</div>
                        <p className="text-xs text-muted-foreground">Fee module is not active</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-300">Announcements</CardTitle>
                        <Bell className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold text-orange-700 dark:text-orange-400">None yet</div>
                        <p className="text-xs text-orange-600/70 dark:text-orange-300/70">No announcements posted</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader>
                        <CardTitle>Academic Progress</CardTitle>
                        <CardDescription>Recent performance and exam results.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-t border-dashed bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="text-center space-y-2 max-w-sm mx-auto p-6">
                            <FileText className="h-8 w-8 text-slate-300 mx-auto" />
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300">No student linked</h3>
                            <p className="text-sm text-slate-500">
                                Your account has not yet been linked to a student by the school administration. Please contact the office.
                            </p>
                            <Button className="mt-4" variant="outline" asChild>
                                <Link href={`/campus/${slug}`}>Campus Directory</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 border-orange-100 dark:border-orange-900/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>School Communications</CardTitle>
                        <CardDescription>Messages from faculties and admins.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center py-8 text-center">
                            <div className="space-y-2">
                                <Bell className="h-8 w-8 text-slate-300 mx-auto" />
                                <p className="text-sm text-muted-foreground">No messages yet</p>
                                <p className="text-xs text-muted-foreground/60">Communications will appear here once available</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
