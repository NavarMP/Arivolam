"use client";

import { useState } from "react";
import {
    Search,
    Shield,
    Building2,
    Calendar,
} from "lucide-react";

interface UserProfile {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_dev_admin: boolean;
    created_at: string;
    memberships: {
        role: string;
        institution: { name: string; short_name: string | null; slug: string } | null;
    }[];
}

interface UsersTableProps {
    users: UserProfile[];
}

export function UsersTable({ users }: UsersTableProps) {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");

    const filtered = users.filter((user) => {
        const matchesSearch =
            (user.display_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
            (user.username?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
            user.id.toLowerCase().includes(search.toLowerCase());

        const matchesRole =
            roleFilter === "all" ||
            (roleFilter === "dev_admin" && user.is_dev_admin) ||
            user.memberships.some((m) => m.role === roleFilter);

        return matchesSearch && matchesRole;
    });

    const roleOptions = ["all", "dev_admin", "admin", "teacher", "student", "parent"];

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by name, username, or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    {roleOptions.map((role) => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium capitalize transition-colors ${roleFilter === role
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            {role === "dev_admin"
                                ? "Dev Admin"
                                : role}
                        </button>
                    ))}
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                {filtered.length} of {users.length} user{users.length !== 1 ? "s" : ""}
            </p>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50 bg-muted/30">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    User
                                </th>
                                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                                    Institutions
                                </th>
                                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                                    Joined
                                </th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                                    Badges
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filtered.map((user) => (
                                <tr
                                    key={user.id}
                                    className="transition-colors hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary overflow-hidden">
                                                {user.avatar_url ? (
                                                    <img
                                                        src={user.avatar_url}
                                                        alt=""
                                                        className="h-9 w-9 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    (user.display_name?.charAt(0) || "U").toUpperCase()
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">
                                                    {user.display_name || "Anonymous"}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {user.username
                                                        ? `@${user.username}`
                                                        : user.id.slice(0, 8) + "…"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden px-4 py-3 sm:table-cell">
                                        {user.memberships.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {user.memberships.map((m, i) => (
                                                    <span
                                                        key={i}
                                                        className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600"
                                                    >
                                                        <Building2 className="h-2.5 w-2.5" />
                                                        {m.institution?.short_name || m.institution?.name || "Unknown"} ({m.role})
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                No institution
                                            </span>
                                        )}
                                    </td>
                                    <td className="hidden px-4 py-3 md:table-cell">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(user.created_at).toLocaleDateString(
                                                "en-IN",
                                                { day: "numeric", month: "short", year: "numeric" }
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {user.is_dev_admin && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                                                <Shield className="h-3 w-3" />
                                                DEV
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filtered.length === 0 && (
                    <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                        No users found
                    </div>
                )}
            </div>
        </div>
    );
}
