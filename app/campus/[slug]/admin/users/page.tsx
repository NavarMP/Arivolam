"use client";

import { useEffect, useState, useTransition } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Clock, Users, UserCheck } from "lucide-react";
import { updateUserRole, approveEnrollment, rejectEnrollment, getCampusUsersData } from "./actions";
import { useParams } from "next/navigation";
import { toast } from "sonner";

type Member = {
    user_id: string;
    role: string;
    user_email: string | null;
    created_at: string;
};

type PendingEnrollment = {
    id: string;
    email: string | null;
    register_number: string | null;
    admission_number: string | null;
    role: string;
    department: string | null;
    created_at: string;
};

export default function CampusUsersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [pending, setPending] = useState<PendingEnrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"members" | "pending">("pending");
    const [isPending, startTransition] = useTransition();
    const params = useParams();
    const slug = params.slug as string;

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        setLoading(true);

        try {
            const data = await getCampusUsersData(slug);

            setMembers(
                data.members.map((m: any) => ({
                    ...m,
                    user_email: m.user_id,
                }))
            );

            setPending(data.pending || []);
        } catch (error: any) {
            toast.error(error.message || "Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setMembers((prev) =>
            prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m))
        );

        try {
            const result = await updateUserRole(userId, newRole as any, slug);
            if (result.error) throw new Error(result.error);
        } catch (error) {
            console.error("Failed to update role:", error);
            fetchData();
            toast.error("Failed to update role");
        }
    };

    const handleApprove = (enrollmentId: string) => {
        startTransition(async () => {
            const result = await approveEnrollment(enrollmentId, slug);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Enrollment approved!");
                fetchData();
            }
        });
    };

    const handleReject = (enrollmentId: string) => {
        if (!confirm("Are you sure you want to reject this enrollment?")) return;
        startTransition(async () => {
            const result = await rejectEnrollment(enrollmentId, slug);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Enrollment rejected.");
                fetchData();
            }
        });
    };

    const getRoleBadgeClasses = (role: string) => {
        switch (role) {
            case "admin": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
            case "faculty": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            default: return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
        }
    };

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
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">
                    Manage members and approve enrollment requests.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab("pending")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "pending"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                >
                    <Clock className="h-4 w-4" />
                    Pending Approvals
                    {pending.length > 0 && (
                        <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-background/20 text-[10px] font-bold">
                            {pending.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("members")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "members"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                >
                    <Users className="h-4 w-4" />
                    All Members ({members.length})
                </button>
            </div>

            {/* Pending Approvals */}
            {activeTab === "pending" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-amber-500" />
                            Pending Enrollment Requests
                        </CardTitle>
                        <CardDescription>
                            Review and approve or reject new user signups.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pending.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500/50" />
                                No pending enrollment requests.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Identifier</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pending.map((enrollment) => (
                                        <TableRow key={enrollment.id}>
                                            <TableCell>
                                                <div className="space-y-0.5">
                                                    {enrollment.email && (
                                                        <p className="text-sm font-medium">{enrollment.email}</p>
                                                    )}
                                                    {enrollment.register_number && (
                                                        <p className="text-xs text-muted-foreground">Reg: {enrollment.register_number}</p>
                                                    )}
                                                    {enrollment.admission_number && (
                                                        <p className="text-xs text-muted-foreground">Adm: {enrollment.admission_number}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeClasses(enrollment.role)}`}>
                                                    {enrollment.role}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {enrollment.department || "—"}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(enrollment.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
                                                        onClick={() => handleApprove(enrollment.id)}
                                                        disabled={isPending}
                                                    >
                                                        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-1 text-destructive border-destructive/20 hover:bg-destructive/5"
                                                        onClick={() => handleReject(enrollment.id)}
                                                        disabled={isPending}
                                                    >
                                                        <XCircle className="h-3 w-3" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* All Members */}
            {activeTab === "members" && (
                <Card>
                    <CardHeader>
                        <CardTitle>All Members ({members.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Change Role</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((member) => (
                                    <TableRow key={member.user_id}>
                                        <TableCell className="font-medium font-mono text-xs">
                                            {member.user_id.slice(0, 8)}...
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeClasses(member.role)}`}>
                                                {member.role}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(member.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Select
                                                defaultValue={member.role}
                                                onValueChange={(val) => handleRoleChange(member.user_id, val)}
                                            >
                                                <SelectTrigger className="w-[130px]">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="student">Student</SelectItem>
                                                    <SelectItem value="faculty">Faculty</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
