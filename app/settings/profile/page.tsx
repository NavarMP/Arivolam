"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Camera, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";

export default function ProfileSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function loadProfile() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }
            setUser(user);

            const { data } = await supabase
                .from('arivolam_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) setProfile(data);
            setLoading(false);
        }
        loadProfile();
    }, [supabase, router]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setMessage(null);
        const formData = new FormData(e.currentTarget);

        const updates = {
            id: user.id,
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            username: formData.get('username'),
            bio: formData.get('bio'),
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('arivolam_profiles').upsert(updates);

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        }
        setSaving(false);
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Profile</h3>
                <p className="text-sm text-muted-foreground">
                    This is how others will see you on the site.
                </p>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-border/50 bg-muted flex-shrink-0">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground uppercase">
                            {profile?.first_name?.[0] || user?.email?.[0] || '?'}
                        </div>
                    )}
                    <button className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100">
                        <Camera className="h-6 w-6" />
                    </button>
                </div>
                <div>
                    <h4 className="text-sm font-medium mb-1">Avatar Image</h4>
                    <p className="text-xs text-muted-foreground mb-3 max-w-sm">
                        Upload a picture of yourself. We recommend a square image at least 400x400 pixels.
                    </p>
                    <Button size="sm" variant="outline" className="rounded-xl">Change Avatar</Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t border-border/40">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="first_name">First Name</Label>
                        <Input id="first_name" name="first_name" defaultValue={profile?.first_name || ''} className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input id="last_name" name="last_name" defaultValue={profile?.last_name || ''} className="rounded-xl" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="flex rounded-xl shadow-sm">
                        <span className="inline-flex items-center rounded-l-xl border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                            arivolam.vercel.app/
                        </span>
                        <Input
                            id="username"
                            name="username"
                            defaultValue={profile?.username || ''}
                            className="rounded-l-none rounded-r-xl focus-visible:z-10"
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Your unique profile URL. Changing this may break existing links.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                        id="bio"
                        name="bio"
                        defaultValue={profile?.bio || ''}
                        className="min-h-[100px] resize-none rounded-xl"
                        placeholder="Tell us a little bit about yourself"
                    />
                    <p className="text-[10px] text-muted-foreground">Brief description for your profile. URLs are hyperlinked.</p>
                </div>

                <div className="pt-4 flex items-center gap-4">
                    <Button type="submit" disabled={saving} className="gap-2 rounded-xl px-8 shadow-sm">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                    </Button>
                    {message && (
                        <p className={`text-sm ${message.type === 'success' ? 'text-green-500' : 'text-destructive'}`}>
                            {message.text}
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}
