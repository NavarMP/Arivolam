"use client";

import { useState, useTransition } from "react";
import { Pencil, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { updateOwnProfile } from "./actions";

interface Props {
    slug: string;
    profileData: {
        full_name: string;
        phone?: string | null;
        department?: string | null;
        isErp: boolean;
    };
}

export default function ProfileEditButton({ slug, profileData }: Props) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [fullName, setFullName] = useState(profileData.full_name);
    const [phone, setPhone] = useState(profileData.phone || "");
    const [department, setDepartment] = useState(profileData.department || "");

    function handleSave() {
        if (!fullName.trim()) {
            toast.error("Name is required");
            return;
        }
        startTransition(async () => {
            const result = await updateOwnProfile(slug, {
                full_name: fullName.trim(),
                phone: phone.trim(),
                department: department.trim(),
            });
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Profile updated");
                setOpen(false);
                window.location.reload();
            }
        });
    }

    return (
        <>
            <Button variant="outline" className="gap-2 rounded-xl" onClick={() => setOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit Profile
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Full Name *</Label>
                            <Input
                                id="edit-name"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                placeholder="Your full name"
                                className="rounded-xl"
                            />
                        </div>
                        {profileData.isErp && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-phone">Phone</Label>
                                    <Input
                                        id="edit-phone"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="+91 ..."
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-dept">Department</Label>
                                    <Input
                                        id="edit-dept"
                                        value={department}
                                        onChange={e => setDepartment(e.target.value)}
                                        placeholder="e.g., Computer Science"
                                        className="rounded-xl"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
                            <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isPending} className="gap-2 rounded-xl">
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
