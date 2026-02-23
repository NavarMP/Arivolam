"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    ExternalLink,
    Search,
    ToggleLeft,
    ToggleRight,
    Users,
    MapPin,
    Plus,
    Edit2,
    Trash2,
    MoreHorizontal,
    Loader2,
    X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    createInstitution,
    updateInstitution,
    toggleInstitution,
    deleteInstitution,
} from "@/app/dev-admin/actions";
import { useToast } from "@/hooks/use-toast";

interface Institution {
    id: string;
    name: string;
    short_name: string | null;
    slug: string;
    description?: string | null;
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

function InstitutionDialog({
    institution,
    onClose,
}: {
    institution?: Institution;
    onClose: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();
    const isEdit = !!institution;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = isEdit
                ? await updateInstitution(institution!.id, formData)
                : await createInstitution(formData);

            if (result.error) {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            } else {
                toast({ title: isEdit ? "Updated!" : "Created!" });
                router.refresh();
                onClose();
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl border border-border/50 bg-card p-6 shadow-2xl my-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">
                            {isEdit ? "Edit Institution" : "Register Institution"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {isEdit ? "Update details for the campus" : "Set up a new campus on the platform"}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Institution Details */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">1</div>
                            <h3 className="font-semibold">Institution Details</h3>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-sm">Institution Name *</Label>
                                <Input id="name" name="name" defaultValue={institution?.name} placeholder="e.g. SAFI Institute" required />
                            </div>
                            {!isEdit ? (
                                <div className="space-y-1.5">
                                    <Label htmlFor="slug" className="text-sm">Campus URL (slug) *</Label>
                                    <Input id="slug" name="slug" placeholder="e.g. sias" required />
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <Label htmlFor="short_name" className="text-sm">Short Name</Label>
                                    <Input id="short_name" name="short_name" defaultValue={institution?.short_name || ""} placeholder="e.g. SIAS" />
                                </div>
                            )}
                        </div>

                        {!isEdit && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5 col-span-2">
                                    <Label htmlFor="description" className="text-sm">Description</Label>
                                    <textarea id="description" name="description" placeholder="Brief description..." className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none h-16" />
                                </div>
                            </div>
                        )}
                        {isEdit && (
                            <div className="space-y-1.5">
                                <Label htmlFor="description" className="text-sm">Description</Label>
                                <textarea id="description" name="description" placeholder="Brief description..." className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none h-16" />
                            </div>
                        )}
                    </div>

                    {/* Section 2: Location */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">2</div>
                            <h3 className="font-semibold">Location</h3>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="city" className="text-sm">City</Label>
                            <Input id="city" name="city" defaultValue={institution?.city || ""} placeholder="e.g. Malappuram" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="state" className="text-sm">State</Label>
                                <Input id="state" name="state" defaultValue={institution?.state || ""} placeholder="e.g. Kerala" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="country" className="text-sm">Country</Label>
                                <Input id="country" name="country" defaultValue={institution?.country || "India"} placeholder="India" />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Admin Account */}
                    {!isEdit && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">3</div>
                                <h3 className="font-semibold">Founding Admin Account</h3>
                            </div>
                            <div className="p-3 mb-2 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400">
                                This account will have full access to manage the campus.
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="adminName" className="text-sm">Full Name *</Label>
                                <Input id="adminName" name="adminName" placeholder="Admin's full name" required />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="adminEmail" className="text-sm">Email Address *</Label>
                                    <Input id="adminEmail" name="adminEmail" type="email" placeholder="admin@institution.edu" required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="adminPassword" className="text-sm">Password *</Label>
                                    <Input id="adminPassword" name="adminPassword" type="password" placeholder="Min 6 characters" required minLength={6} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                        <Button type="button" variant="outline" onClick={onClose} className="px-6 rounded-xl">Cancel</Button>
                        <Button type="submit" disabled={isPending} className="gap-2 px-6 rounded-xl">
                            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isEdit ? "Save Changes" : "Register Campus"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function InstitutionsTable({ institutions }: InstitutionsTableProps) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
    const [showDialog, setShowDialog] = useState(false);
    const [editingInst, setEditingInst] = useState<Institution | undefined>();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

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

    const handleToggle = (inst: Institution) => {
        startTransition(async () => {
            const result = await toggleInstitution(inst.id, !inst.is_active);
            if (result.error) {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            } else {
                toast({ title: `${inst.short_name || inst.name} ${inst.is_active ? "deactivated" : "activated"}` });
                router.refresh();
            }
        });
    };

    const handleDelete = (inst: Institution) => {
        if (!confirm(`Delete "${inst.name}"? This cannot be undone.`)) return;
        startTransition(async () => {
            const result = await deleteInstitution(inst.id);
            if (result.error) {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            } else {
                toast({ title: "Deleted", description: `${inst.name} has been removed.` });
                router.refresh();
            }
        });
    };

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
                    <Button
                        size="sm"
                        className="ml-2 gap-1.5 rounded-lg"
                        onClick={() => { setEditingInst(undefined); setShowDialog(true); }}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Create
                    </Button>
                </div>
            </div>

            <p className="text-xs text-muted-foreground">
                {filtered.length} of {institutions.length} institution{institutions.length !== 1 ? "s" : ""}
            </p>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/50 bg-muted/30">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Institution</th>
                                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Location</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Members</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filtered.map((inst) => (
                                <tr key={inst.id} className="transition-colors hover:bg-muted/20">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
                                                <img src={inst.logo_url || "/assets/Logo.svg"} alt={inst.name} className="h-7 w-7 object-contain" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{inst.short_name || inst.name}</p>
                                                <p className="text-xs text-muted-foreground">/{inst.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {inst.city || "—"}{inst.state ? `, ${inst.state}` : ""}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Users className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-xs font-medium">{inst.memberCount}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleToggle(inst)}
                                            disabled={isPending}
                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${inst.is_active
                                                ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                }`}
                                        >
                                            {inst.is_active ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                                            {inst.is_active ? "Active" : "Inactive"}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/campus/${inst.slug}`} className="flex items-center gap-2">
                                                        <ExternalLink className="h-3.5 w-3.5" /> Visit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setEditingInst(inst); setShowDialog(true); }}>
                                                    <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleDelete(inst)} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="px-4 py-12 text-center text-sm text-muted-foreground">No institutions found</div>
                )}
            </div>

            {/* Create/Edit Dialog */}
            {showDialog && (
                <InstitutionDialog
                    institution={editingInst}
                    onClose={() => setShowDialog(false)}
                />
            )}
        </div>
    );
}
