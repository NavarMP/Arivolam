"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { updateUserRole } from "./actions";
import { useParams } from "next/navigation";

type Member = {
    user_id: string;
    role: string;
    user_email: string | null;
    created_at: string;
};

export default function CampusUsersPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const params = useParams();
    const slug = params.slug as string;

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);

        // Get institution ID from slug
        const { data: institution } = await supabase
            .from("institutions")
            .select("id")
            .eq("slug", slug)
            .single();

        if (!institution) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from("institution_members")
            .select("user_id, role, created_at")
            .eq("institution_id", institution.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching members:", error);
        } else {
            // We'll show user_id for now; in production you'd join with profiles
            setMembers(
                (data || []).map((m) => ({
                    ...m,
                    user_email: m.user_id, // placeholder
                }))
            );
        }
        setLoading(false);
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setMembers((prev) =>
            prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m))
        );

        try {
            const result = await updateUserRole(userId, newRole as any, slug);
            if (result.error) {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Failed to update role:", error);
            fetchMembers();
            alert("Failed to update role");
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
                    View and manage member roles in this institution.
                </p>
            </div>

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
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${member.role === "admin"
                                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                                    : member.role === "teacher"
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                        : member.role === "parent"
                                                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                                                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                                }`}
                                        >
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
                                                <SelectItem value="teacher">Teacher</SelectItem>
                                                <SelectItem value="parent">Parent</SelectItem>
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
        </div>
    );
}
