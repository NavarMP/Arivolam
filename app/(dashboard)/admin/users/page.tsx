"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, CheckCircle2, Circle } from "lucide-react";
import { updateEnrollmentRole, deleteEnrollment } from "./enrollment-actions";
import { CreateEnrollmentForm } from "./create-enrollment-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Assuming sonner or similar usage, otherwise use simple alert

type Enrollment = {
    id: string;
    institution_id: string;
    email: string | null;
    phone: string | null;
    register_number: string | null;
    admission_number: string | null;
    username: string | null;
    employee_id: string | null;
    role: "student" | "staff" | "parent" | "admin";
    is_claimed: boolean;
    created_at: string;
};

export default function AdminUsersPage() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [institutionId, setInstitutionId] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchContextAndEnrollments();
    }, []);

    const fetchContextAndEnrollments = async () => {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        // 1. Fetch Admin's Institution ID
        let currentInstId = null;
        const { data: membership } = await supabase
            .from("institution_members")
            .select("institution_id")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .limit(1)
            .single();

        if (membership) {
            currentInstId = membership.institution_id;
        } else {
            // Fallback for dev admins
            const { data: sias } = await supabase.from("institutions").select("id").eq("slug", "sias").single();
            if (sias) currentInstId = sias.id;
        }

        setInstitutionId(currentInstId);

        // 2. Fetch Enrollments
        if (currentInstId) {
            const { data: enrollmentsData, error } = await supabase
                .from("enrollments")
                .select("*")
                .eq("institution_id", currentInstId)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching enrollments:", error);
                toast.error("Failed to load users");
            } else {
                setEnrollments(enrollmentsData as Enrollment[]);
            }
        }

        setLoading(false);
    };

    const handleRoleChange = async (enrollmentId: string, newRole: string) => {
        setEnrollments((prev) =>
            prev.map((e) => (e.id === enrollmentId ? { ...e, role: newRole as any } : e))
        );

        try {
            const result = await updateEnrollmentRole(enrollmentId, newRole);
            if (result.error) {
                throw new Error(result.error);
            }
            toast.success("Role updated");
        } catch (error: any) {
            console.error("Failed to update role:", error);
            fetchContextAndEnrollments();
            toast.error(error.message || "Failed to update role");
        }
    };

    const handleDelete = async (enrollmentId: string) => {
        if (!confirm("Are you sure you want to completely remove this enrollment?")) return;

        // Optimistic delete
        setEnrollments(prev => prev.filter(e => e.id !== enrollmentId));

        try {
            const result = await deleteEnrollment(enrollmentId);
            if (result.error) {
                throw new Error(result.error);
            }
            toast.success("Enrollment deleted");
        } catch (error: any) {
            console.error("Failed to delete enrollment:", error);
            fetchContextAndEnrollments();
            toast.error(error.message || "Failed to delete enrollment");
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Access Management</h1>
                <p className="text-muted-foreground">
                    Create and manage authorized enrollments and logins for your institution.
                </p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>Enrollments ({enrollments.length})</CardTitle>
                    {institutionId && (
                        <CreateEnrollmentForm institutionId={institutionId} />
                    )}
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Identifier</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enrollments.map((enr) => (
                                    <TableRow key={enr.id}>
                                        <TableCell className="font-medium">
                                            {enr.username || enr.admission_number || enr.register_number || enr.employee_id || "No ID"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {enr.email || enr.phone || "No contact"}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${enr.role === "admin"
                                                        ? "bg-red-100 text-red-800"
                                                        : enr.role === "staff"
                                                            ? "bg-green-100 text-green-800"
                                                            : enr.role === "parent"
                                                                ? "bg-orange-100 text-orange-800"
                                                                : "bg-blue-100 text-blue-800"
                                                    }`}
                                            >
                                                {enr.role === "staff" ? "Staff/Teacher" : enr.role}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {enr.is_claimed ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs text-green-600 bg-green-500/10 px-2 py-1 rounded-md font-medium">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Linked
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md font-medium">
                                                    <Circle className="w-3.5 h-3.5" /> Unclaimed
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Select
                                                    defaultValue={enr.role}
                                                    onValueChange={(val) => handleRoleChange(enr.id, val)}
                                                >
                                                    <SelectTrigger className="w-[120px] h-8 text-xs">
                                                        <SelectValue placeholder="Role" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="student">Student</SelectItem>
                                                        <SelectItem value="staff">Staff</SelectItem>
                                                        <SelectItem value="parent">Parent</SelectItem>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => handleDelete(enr.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {enrollments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                            No enrollments found. create one above.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
