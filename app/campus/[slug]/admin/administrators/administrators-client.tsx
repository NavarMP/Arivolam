"use client";

import { useState, useEffect, useTransition } from "react";
import {
    ShieldCheck,
    UserPlus,
    Search,
    MoreVertical,
    ShieldOff,
    Mail,
    BadgeCheck,
    Loader2,
    Crown,
    Users,
    AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { promoteToAdmin, demoteAdmin, getNonAdminMembers } from "./actions";

interface Admin {
    user_id: string;
    is_active: boolean;
    full_name: string;
    email: string;
    avatar_url: string | null;
    employee_id: string | null;
}

interface NonAdminMember {
    user_id: string;
    role: string;
    full_name: string;
    email: string;
}

interface Props {
    admins: Admin[];
    slug: string;
}

export default function AdministratorsClient({ admins: initialAdmins, slug }: Props) {
    const [admins, setAdmins] = useState(initialAdmins);
    const [search, setSearch] = useState("");
    const [isPromoteOpen, setIsPromoteOpen] = useState(false);
    const [nonAdmins, setNonAdmins] = useState<NonAdminMember[]>([]);
    const [memberSearch, setMemberSearch] = useState("");
    const [isPending, startTransition] = useTransition();

    const filteredAdmins = admins.filter(a =>
        a.full_name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())
    );

    const filteredMembers = nonAdmins.filter(m =>
        m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.email.toLowerCase().includes(memberSearch.toLowerCase())
    );

    async function openPromoteDialog() {
        try {
            const members = await getNonAdminMembers(slug);
            setNonAdmins(members);
            setIsPromoteOpen(true);
        } catch (err) {
            toast.error("Failed to load members");
        }
    }

    function handlePromote(userId: string, name: string) {
        startTransition(async () => {
            const result = await promoteToAdmin(userId, slug);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${name} promoted to admin`);
                setIsPromoteOpen(false);
                window.location.reload();
            }
        });
    }

    function handleDemote(userId: string, name: string) {
        startTransition(async () => {
            const result = await demoteAdmin(userId, slug);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${name} removed from administrators`);
                setAdmins(prev => prev.filter(a => a.user_id !== userId));
            }
        });
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-rose-500" />
                        Administrators
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage admin access for your campus. Admins have full control.
                    </p>
                </div>
                <Dialog open={isPromoteOpen} onOpenChange={setIsPromoteOpen}>
                    <Button onClick={openPromoteDialog} className="gap-2 rounded-xl">
                        <UserPlus className="h-4 w-4" />
                        Add Administrator
                    </Button>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Promote to Administrator</DialogTitle>
                            <DialogDescription>
                                Select a faculty or student to promote to admin role.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search members..."
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    className="pl-9 rounded-xl"
                                />
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-1.5">
                                {filteredMembers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-6">
                                        No members found
                                    </p>
                                ) : (
                                    filteredMembers.map((m) => (
                                        <div
                                            key={m.user_id}
                                            className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{m.full_name}</p>
                                                <p className="text-xs text-muted-foreground">{m.email}</p>
                                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mt-1 bg-muted text-muted-foreground">
                                                    {m.role}
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-1.5 rounded-lg shrink-0 ml-2"
                                                onClick={() => handlePromote(m.user_id, m.full_name)}
                                                disabled={isPending}
                                            >
                                                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Crown className="h-3 w-3" />}
                                                Promote
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search administrators..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 rounded-xl"
                />
            </div>

            {/* Stats */}
            <div className="flex gap-4">
                <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2 text-sm">
                    <ShieldCheck className="h-4 w-4 text-rose-500" />
                    <span className="font-medium">{admins.length}</span>
                    <span className="text-muted-foreground">Administrators</span>
                </div>
            </div>

            {/* Admin Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAdmins.map((admin, index) => (
                    <div
                        key={admin.user_id}
                        className="relative group rounded-2xl border border-border/50 bg-card p-5 transition-all hover:border-rose-500/30 hover:shadow-lg hover:shadow-rose-500/5"
                    >
                        {/* First admin crown */}
                        {index === 0 && (
                            <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 shadow-lg shadow-amber-500/30">
                                <Crown className="h-3.5 w-3.5 text-white" />
                            </div>
                        )}

                        <div className="flex items-start gap-3">
                            {/* Avatar */}
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                                {admin.avatar_url ? (
                                    <img src={admin.avatar_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
                                ) : (
                                    <ShieldCheck className="h-6 w-6 text-rose-500" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{admin.full_name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                    <Mail className="h-3 w-3 shrink-0" />
                                    {admin.email || "No email"}
                                </p>
                                {admin.employee_id && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <BadgeCheck className="h-3 w-3 shrink-0" />
                                        {admin.employee_id}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            {admins.length > 1 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            className="text-destructive gap-2"
                                            onClick={() => handleDemote(admin.user_id, admin.full_name)}
                                        >
                                            <ShieldOff className="h-4 w-4" />
                                            Remove Admin
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        {/* Badge */}
                        <div className="mt-3 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                                <ShieldCheck className="h-3 w-3" />
                                Admin
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {filteredAdmins.length === 0 && (
                <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No administrators found</p>
                </div>
            )}

            {/* Warning */}
            {admins.length === 1 && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Single Admin Warning</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            You are the only administrator. Consider adding another admin for backup access.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
