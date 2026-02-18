"use client";

import { useState } from "react";
import {
    ExternalLink,
    Search,
    ToggleLeft,
    ToggleRight,
    Users,
    MapPin,
} from "lucide-react";
import Link from "next/link";

interface Institution {
    id: string;
    name: string;
    short_name: string | null;
    slug: string;
    type: string;
    city: string | null;
    state: string | null;
    country: string;
    logo_url: string | null;
    is_active: boolean;
    created_at: string;
    memberCount: number;
}

interface InstitutionsTableProps {
    institutions: Institution[];
}

export function InstitutionsTable({ institutions }: InstitutionsTableProps) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

    const filtered = institutions.filter((inst) => {
        const matchesSearch =
            inst.name.toLowerCase().includes(search.toLowerCase()) ||
            inst.slug.toLowerCase().includes(search.toLowerCase()) ||
            (inst.short_name?.toLowerCase().includes(search.toLowerCase()) ?? false);

        const matchesFilter =
            filter === "all" ||
            (filter === "active" && inst.is_active) ||
            (filter === "inactive" && !inst.is_active);

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search institutions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    />
                </div>
                <div className="flex items-center gap-2">
                    {(["all", "active", "inactive"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${filter === f
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Count */}
            <p className="text-xs text-muted-foreground">
                {filtered.length} of {institutions.length} institution{institutions.length !== 1 ? "s" : ""}
            </p>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50 bg-muted/30">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                    Institution
                                </th>
                                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                                    Type
                                </th>
                                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                                    Location
                                </th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                                    Members
                                </th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filtered.map((inst) => (
                                <tr
                                    key={inst.id}
                                    className="transition-colors hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
                                                <img
                                                    src={inst.logo_url || "/assets/Logo.svg"}
                                                    alt={inst.name}
                                                    className="h-7 w-7 object-contain"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">
                                                    {inst.short_name || inst.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    /{inst.slug}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden px-4 py-3 md:table-cell">
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                                            {inst.type}
                                        </span>
                                    </td>
                                    <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {inst.city || "—"}
                                            {inst.state ? `, ${inst.state}` : ""}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Users className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-xs font-medium">
                                                {inst.memberCount}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${inst.is_active
                                                    ? "bg-emerald-500/10 text-emerald-600"
                                                    : "bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            {inst.is_active ? (
                                                <ToggleRight className="h-3 w-3" />
                                            ) : (
                                                <ToggleLeft className="h-3 w-3" />
                                            )}
                                            {inst.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Link href={`/campus/${inst.slug}`}>
                                            <button className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors">
                                                <ExternalLink className="h-3 w-3" />
                                                Visit
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filtered.length === 0 && (
                    <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                        No institutions found
                    </div>
                )}
            </div>
        </div>
    );
}
