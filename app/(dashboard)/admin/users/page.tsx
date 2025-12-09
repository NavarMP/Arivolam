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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner or similar usage, otherwise console
import { updateUserRole } from "./actions";

type Profile = {
    id: string;
    email: string | null;
    role: "student" | "teacher" | "parent" | "admin";
    created_at: string;
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching users:", error);
        } else {
            setUsers(data as Profile[]);
        }
        setLoading(false);
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        // Optimistic update
        setUsers((prev) =>
            prev.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u))
        );

        try {
            const result = await updateUserRole(userId, newRole as any);
            if (result.error) {
                throw new Error(result.error);
            }
            // Success
        } catch (error) {
            console.error("Failed to update role:", error);
            // Revert on error
            fetchUsers();
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
                    View and manage user roles across the platform.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users ({users.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.role === "admin"
                                                    ? "bg-red-100 text-red-800"
                                                    : user.role === "teacher"
                                                        ? "bg-green-100 text-green-800"
                                                        : user.role === "parent"
                                                            ? "bg-orange-100 text-orange-800"
                                                            : "bg-blue-100 text-blue-800"
                                                }`}
                                        >
                                            {user.role}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Select
                                            defaultValue={user.role}
                                            onValueChange={(val) => handleRoleChange(user.id, val)}
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
