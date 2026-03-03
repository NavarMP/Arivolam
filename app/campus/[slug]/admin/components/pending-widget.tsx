"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { approveEnrollment, rejectEnrollment } from "../users/actions";
import { toast } from "sonner";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

type PendingEnrollment = {
    id: string;
    full_name: string | null;
    email: string | null;
    register_number: string | null;
    admission_number: string | null;
    role: string;
    department: string | null;
    created_at: string;
};

export function PendingWidget({
    initialPendings,
    slug,
}: {
    initialPendings: PendingEnrollment[];
    slug: string;
}) {
    const [pendings, setPendings] = useState(initialPendings);
    const [isPending, startTransition] = useTransition();

    const handleApprove = (enrollmentId: string) => {
        startTransition(async () => {
            const result = await approveEnrollment(enrollmentId, slug);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Enrollment approved!");
                setPendings((prev) => prev.filter((p) => p.id !== enrollmentId));
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
                setPendings((prev) => prev.filter((p) => p.id !== enrollmentId));
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

    return (
        <Card className="col-span-full xl:col-span-2 flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-amber-500" />
                        Pending Approvals
                        {pendings.length > 0 && (
                            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                {pendings.length}
                            </span>
                        )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                        Recent requests trying to join the campus.
                    </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-xs">
                    <Link href={`/campus/${slug}/admin/users`}>
                        View All <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                {pendings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mb-3 text-emerald-500/50" />
                        <p>You&apos;re all caught up!</p>
                        <p className="text-xs">No pending enrollment requests.</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[300px] w-full px-6 pb-6">
                        <div className="space-y-4">
                            {pendings.slice(0, 10).map((p) => (
                                <div
                                    key={p.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{p.full_name || p.email || p.register_number || p.admission_number}</span>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeClasses(p.role)}`}>
                                                {p.role}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                            {p.department && <span>{p.department}</span>}
                                            {p.department && <span>•</span>}
                                            <span>
                                                {p.register_number && `Reg: ${p.register_number}`}
                                                {p.register_number && p.admission_number && " | "}
                                                {p.admission_number && `Adm: ${p.admission_number}`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
                                            onClick={() => handleApprove(p.id)}
                                            disabled={isPending}
                                        >
                                            {isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-destructive border-destructive/20 hover:bg-destructive/5"
                                            onClick={() => handleReject(p.id)}
                                            disabled={isPending}
                                        >
                                            <XCircle className="h-4 w-4 shrink-0" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
