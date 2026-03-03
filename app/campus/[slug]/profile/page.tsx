import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, GraduationCap, Grid } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function CampusProfilePage({
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

    let profileData: any = null;

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

        if (enrollment) {
            profileData = {
                ...enrollment,
                isErp: true
            };
        }
    }

    // Method 2: Fallback to Supabase Auth user
    if (!profileData && user) {
        const { data: member } = await supabase
            .from("institution_members")
            .select("*")
            .eq("user_id", user.id)
            .eq("institution_id", institution.id)
            .single();

        if (member) {
            profileData = {
                ...member,
                full_name: user.user_metadata?.full_name,
                email: user.email,
                isErp: false
            };
        }
    }

    if (!profileData) {
        redirect(`/campus/${slug}`);
    }

    const name = profileData.full_name || "Campus User";
    const email = profileData.email || profileData.identifier; // Fallback to identifier for ERP
    const roleMatch = profileData.role;

    // Determine Role Label
    let roleLabel = "Member";
    if (roleMatch === "student") roleLabel = "Student";
    if (roleMatch === "faculty") roleLabel = "Faculty";
    if (roleMatch === "admin") roleLabel = "Administrator";

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            <div className="relative h-48 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="absolute -bottom-16 left-8 flex items-end">
                    <Avatar className="h-32 w-32 rounded-full border-4 border-background bg-zinc-200">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-4xl text-primary font-bold">
                            {name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>

            <div className="mt-20 px-8">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">{name}</h1>
                        <p className="text-muted-foreground capitalize">
                            {profileData.department ? `${profileData.department} • ` : ""}
                            {roleLabel}
                        </p>
                    </div>
                    {/* Placeholder for future edit functionality (Requires a separate form page) */}
                    <Button variant="outline">Edit Profile</Button>
                </div>
            </div>

            <div className="grid gap-6 px-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Personal Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex flex-col border-b py-2 text-sm last:border-0">
                            <span className="text-muted-foreground mb-1">Entity Identifier</span>
                            <span className="font-medium bg-muted w-fit px-2 py-0.5 rounded text-xs select-all">
                                {profileData.identifier || profileData.user_id || profileData.id}
                            </span>
                        </div>
                        {profileData.admission_number && (
                            <div className="flex justify-between border-b py-2 text-sm last:border-0">
                                <span className="text-muted-foreground">Admission No</span>
                                <span className="font-medium">{profileData.admission_number}</span>
                            </div>
                        )}
                        {profileData.register_number && (
                            <div className="flex justify-between border-b py-2 text-sm last:border-0">
                                <span className="text-muted-foreground">Register No</span>
                                <span className="font-medium">{profileData.register_number}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-b py-2 text-sm last:border-0">
                            <span className="text-muted-foreground">Account Type</span>
                            <span className="font-medium inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                {profileData.isErp ? "ERP Link" : "Ariv Social"}
                            </span>
                        </div>
                        {profileData.is_approved !== undefined && (
                            <div className="flex justify-between border-b py-2 text-sm last:border-0">
                                <span className="text-muted-foreground">Status</span>
                                <span className={`font-medium ${profileData.is_approved ? "text-emerald-600" : "text-amber-600"}`}>
                                    {profileData.is_approved ? "Active" : "Pending Approval"}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Academic Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between border-b py-2 text-sm last:border-0">
                            <span className="text-muted-foreground">Role</span>
                            <span className="font-medium capitalize">{roleMatch || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b py-2 text-sm last:border-0">
                            <span className="text-muted-foreground">Department</span>
                            <span className="font-medium">{profileData.department || "Not specified"}</span>
                        </div>
                        <div className="flex justify-between border-b py-2 text-sm last:border-0">
                            <span className="text-muted-foreground">Joined</span>
                            <span className="font-medium">
                                {new Date(profileData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm md:col-span-2 lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" /> Contact Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {email && (
                            <div className="flex items-center gap-3 border-b py-3 text-sm last:border-0">
                                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="font-medium truncate" title={email}>{email}</span>
                            </div>
                        )}
                        {profileData.phone && (
                            <div className="flex items-center gap-3 border-b py-3 text-sm last:border-0">
                                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="font-medium">{profileData.phone}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 border-b py-3 text-sm last:border-0">
                            <Grid className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">{institution.name}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
