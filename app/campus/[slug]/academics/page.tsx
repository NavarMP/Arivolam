import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, GraduationCap, Users } from "lucide-react";

export default async function AcademicsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: institution } = await supabase
        .from("institutions")
        .select("id, name")
        .eq("slug", slug)
        .single();

    if (!institution) return <div className="p-8 text-center">Institution not found</div>;

    const sc = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const [
        { data: departments },
        { data: subjects },
        { data: semesters },
    ] = await Promise.all([
        sc.from("departments").select("*").eq("institution_id", institution.id).eq("is_active", true).order("name"),
        sc.from("subjects").select("*, department:departments(id, name, code), semester:semesters(id, name)").order("code"),
        sc.from("semesters").select("*").eq("institution_id", institution.id).eq("is_active", true).order("number"),
    ]);

    // Filter subjects for this institution
    const instSubjects = (subjects || []).filter((s: any) => s.department !== null);

    const typeColors: Record<string, string> = {
        theory: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        lab: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        elective: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        project: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <BookOpen className="h-8 w-8 text-blue-500" /> Academics
                </h1>
                <p className="text-muted-foreground mt-1">{institution.name} — Departments, Subjects & Curriculum</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                            <GraduationCap className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{(departments || []).length}</p>
                            <p className="text-xs text-muted-foreground">Departments</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                            <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{instSubjects.length}</p>
                            <p className="text-xs text-muted-foreground">Subjects</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                            <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{(semesters || []).length}</p>
                            <p className="text-xs text-muted-foreground">Active Semesters</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Departments */}
            {(departments || []).length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Departments</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {(departments || []).map((dept: any) => {
                            const deptSubjects = instSubjects.filter((s: any) => s.department?.id === dept.id);
                            return (
                                <Card key={dept.id} className="hover:shadow-lg transition-all">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg">{dept.name}</CardTitle>
                                                <Badge variant="secondary" className="mt-1 font-mono text-xs">{dept.code}</Badge>
                                            </div>
                                            <Badge variant="outline" className="text-xs">{deptSubjects.length} subjects</Badge>
                                        </div>
                                    </CardHeader>
                                    {dept.description && (
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">{dept.description}</p>
                                        </CardContent>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Subjects */}
            {instSubjects.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Subjects / Papers</h2>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {instSubjects.map((sub: any) => (
                            <Card key={sub.id} className="hover:shadow-md transition-all">
                                <CardContent className="py-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-sm">{sub.name}</h3>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <Badge variant="secondary" className="font-mono text-xs">{sub.code}</Badge>
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${typeColors[sub.subject_type] || "bg-gray-100 text-gray-800"}`}>{sub.subject_type}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{sub.credits} cr</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                                        {sub.department && <span>{sub.department.code}</span>}
                                        {sub.semester && <span>• {sub.semester.name}</span>}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {(departments || []).length === 0 && instSubjects.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold">No academic data yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">Admins can set up departments and subjects from the admin panel.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
