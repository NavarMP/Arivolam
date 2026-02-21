"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createEnrollment } from "./enrollment-actions";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner"; // Using sonner as seen in the page

export function CreateEnrollmentForm({ institutionId }: { institutionId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState("student");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.append("institutionId", institutionId);
        formData.append("role", role);

        const result = await createEnrollment(formData);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("User enrolled securely!");
            setOpen(false);
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    New Enrollment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Enroll New User</DialogTitle>
                    <DialogDescription>
                        Create an enrollment spot. The user's password will be securely hashed.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="staff">Staff/Teacher</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                                <SelectItem value="admin">Administrator</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Email <span className="text-xs text-muted-foreground">(For Auto-Link)</span></Label>
                        <Input name="email" type="email" placeholder="student@sias.edu" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Admission No.</Label>
                            <Input name="admissionNumber" placeholder="ADM123" />
                        </div>
                        <div className="space-y-2">
                            <Label>Register No.</Label>
                            <Input name="registerNumber" placeholder="REG123" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Temporary Password</Label>
                        <Input name="password" required placeholder="Generate a secure password" />
                        <p className="text-[10px] text-muted-foreground">This password will be encrypted using Bcrypt before storage.</p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Enrollment
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
