"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Key, Mail, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { updatePassword, updateEmail, deleteAccount } from "./account-actions";

export default function AccountSettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Form states
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [emailLoading, setEmailLoading] = useState(false);
    const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/auth/login");
                return;
            }
            setUser(user);
            setLoading(false);
        }
        fetchUser();
    }, [router, supabase]);

    const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordMessage(null);

        const formData = new FormData(e.currentTarget);
        const result = await updatePassword(formData);

        if (result.error) {
            setPasswordMessage({ type: 'error', text: result.error });
        } else if (result.success) {
            setPasswordMessage({ type: 'success', text: result.success });
            (e.target as HTMLFormElement).reset();
        }
        setPasswordLoading(false);
    };

    const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setEmailLoading(true);
        setEmailMessage(null);

        const formData = new FormData(e.currentTarget);
        const result = await updateEmail(formData);

        if (result.error) {
            setEmailMessage({ type: 'error', text: result.error });
        } else if (result.success) {
            setEmailMessage({ type: 'success', text: result.success });
            (e.target as HTMLFormElement).reset();
        }
        setEmailLoading(false);
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        const result = await deleteAccount();

        if (result.error) {
            alert(result.error);
            setDeleteLoading(false);
            setIsDeleteDialogOpen(false);
        } else {
            // Success, redirect to landing
            router.push('/');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-10">
            <div>
                <h3 className="text-lg font-medium">Account Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your email, password, and account security.
                </p>
            </div>

            {/* Email Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <h4 className="text-base font-semibold">Change Email</h4>
                </div>

                <p className="text-sm text-muted-foreground">
                    Current email: <strong>{user?.email}</strong>
                </p>

                <form onSubmit={handleEmailSubmit} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                        <Label htmlFor="newEmail">New Email Address</Label>
                        <Input id="newEmail" name="newEmail" type="email" required className="rounded-xl" />
                    </div>

                    <Button type="submit" disabled={emailLoading} className="gap-2 rounded-xl">
                        {emailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Email"}
                    </Button>

                    {emailMessage && (
                        <p className={`text-sm mt-2 ${emailMessage.type === 'success' ? 'text-emerald-500' : 'text-destructive'}`}>
                            {emailMessage.text}
                        </p>
                    )}
                </form>
            </section>

            {/* Password Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <h4 className="text-base font-semibold">Change Password</h4>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" name="newPassword" type="password" required minLength={6} className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} className="rounded-xl" />
                    </div>

                    <Button type="submit" disabled={passwordLoading} className="gap-2 rounded-xl">
                        {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
                    </Button>

                    {passwordMessage && (
                        <p className={`text-sm mt-2 ${passwordMessage.type === 'success' ? 'text-emerald-500' : 'text-destructive'}`}>
                            {passwordMessage.text}
                        </p>
                    )}
                </form>
            </section>

            {/* Danger Zone */}
            <section className="space-y-6 pt-6 mt-10 border-t border-destructive/20">
                <div className="flex items-center gap-2 border-b border-destructive/20 pb-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <h4 className="text-base font-semibold text-destructive">Danger Zone</h4>
                </div>

                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 space-y-4">
                    <h5 className="font-semibold text-destructive">Delete Account</h5>
                    <p className="text-sm text-muted-foreground">
                        Once you delete your account, there is no going back. Please be certain. All your data, posts, and memberships will be permanently removed.
                    </p>

                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" className="rounded-xl">
                                Delete Account
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Are you absolutely sure?</DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This will permanently delete your
                                    account and remove your data from our servers.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="bg-muted p-4 rounded-lg my-4 flex items-center gap-3">
                                <Trash2 className="h-6 w-6 text-destructive shrink-0" />
                                <p className="text-sm font-medium">All personal data, posts, and institution profiles authored by you will be purged.</p>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleteLoading}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading}>
                                    {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, delete my account"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </section>
        </div>
    );
}
