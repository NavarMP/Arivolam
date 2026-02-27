import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, Settings, Bell, BookOpen, Map } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { PendingWidget } from "./components/pending-widget";
import { Button } from "@/components/ui/button";
import { getAdminDashboardData } from "./users/actions";

export default async function CampusAdminPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const supabase = await createClient();

    // 1. Get Institution ID (just for name right now)
    const { data: institution } = await supabase
        .from("institutions")
        .select("id, name")
        .eq("slug", slug)
        .single();

    if (!institution) return <div>Institution not found</div>;

    // 2. Fetch Aggregated Data via Service Action (bypasses RLS strictly for verified admins)
    let dashboardData;
    try {
        dashboardData = await getAdminDashboardData(slug);
    } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }

    const { studentCount, staffCount, pendingEnrollments } = dashboardData;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage {institution.name} ecosystem and users.</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Total Students</CardTitle>
                        <GraduationCap className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{studentCount || 0}</div>
                        <p className="text-xs text-indigo-600/70 dark:text-indigo-300/70">Enrolled and active</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background border-emerald-100 dark:border-emerald-900/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total Staff</CardTitle>
                        <Users className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{staffCount || 0}</div>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-300/70">Teachers and admins</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-background border-amber-100 dark:border-amber-900/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Pending Requests</CardTitle>
                        <Bell className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{pendingEnrollments?.length || 0}</div>
                        <p className="text-xs text-amber-600/70 dark:text-amber-300/70">Require your attention</p>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all shadow-sm group">
                    <Link href={`/campus/${slug}/admin/users`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">User Management</CardTitle>
                            <Settings className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">Manage</div>
                            <p className="text-xs text-muted-foreground">Detailed directory</p>
                        </CardContent>
                    </Link>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid gap-6 xl:grid-cols-3">
                {/* Pending Enrollments Widget (Takes up 2 cols on huge screens) */}
                <div className="xl:col-span-2">
                    <PendingWidget initialPendings={pendingEnrollments || []} slug={slug} />
                </div>

                {/* Secondary Actions / Future widgets */}
                <div className="space-y-6">
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-blue-500" />
                                Modules & Apps
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-2">
                                <Button variant="outline" className="justify-start w-full" disabled>
                                    Timetable Management (Soon)
                                </Button>
                                <Button variant="outline" className="justify-start w-full" disabled>
                                    Library System (Soon)
                                </Button>
                                <Button variant="outline" className="justify-start w-full gap-2" asChild>
                                    <Link href={`/campus/${slug}/admin/map-editor`}>
                                        <Map className="h-4 w-4" />
                                        Campus Map Editor
                                    </Link>
                                </Button>
                                <Button variant="ghost" className="justify-start w-full gap-2 text-muted-foreground" asChild>
                                    <Link href={`/campus/${slug}/admin/map-guide`}>
                                        <BookOpen className="h-4 w-4" />
                                        Map Editor Guide
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
