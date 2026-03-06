"use client";

import { useState } from "react";
import { Loader2, Save, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { updatePersonalProfile } from "./profile-actions";

export function PersonalProfileSettings({ profile }: { profile: any }) {
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form state
    const [displayName, setDisplayName] = useState(profile?.display_name || "");
    const [username, setUsername] = useState(profile?.username || "");
    const [headline, setHeadline] = useState(profile?.headline || "");
    const [bio, setBio] = useState(profile?.bio || "");
    const [location, setLocation] = useState(profile?.location || "");
    const [website, setWebsite] = useState(profile?.website || "");
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
    const [coverUrl, setCoverUrl] = useState(profile?.cover_url || "");

    // Arrays / Objects state
    const [skills, setSkills] = useState<string[]>(profile?.skills || []);
    const [newSkill, setNewSkill] = useState("");

    // For social links, keep it simple for now
    const initialSocials = profile?.social_links || {};
    const [twitter, setTwitter] = useState(initialSocials.twitter || "");
    const [linkedin, setLinkedin] = useState(initialSocials.linkedin || "");
    const [github, setGithub] = useState(initialSocials.github || "");

    const handleAddSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()]);
            setNewSkill("");
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const social_links = {
            ...(twitter && { twitter }),
            ...(linkedin && { linkedin }),
            ...(github && { github }),
        };

        const result = await updatePersonalProfile({
            display_name: displayName,
            username,
            headline,
            bio,
            location,
            website,
            avatar_url: avatarUrl,
            cover_url: coverUrl,
            skills,
            social_links
        });

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
        } else {
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        }

        setSaving(false);
    };

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h3 className="text-lg font-medium">Personal Profile</h3>
                <p className="text-sm text-muted-foreground">
                    This is how others will see you on the platform.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Images Section */}
                <div className="space-y-6">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Images</h4>

                    <div className="grid gap-8 md:grid-cols-2">
                        <ImageUpload
                            label="Avatar"
                            value={avatarUrl}
                            onChange={(url) => setAvatarUrl(url)}
                            aspectRatio={1}
                            bucket="avatars"
                            folder="profiles"
                            width={400}
                            height={400}
                        />

                        <ImageUpload
                            label="Cover Image"
                            value={coverUrl}
                            onChange={(url) => setCoverUrl(url)}
                            aspectRatio={3}
                            bucket="avatars"
                            folder="covers"
                            width={1200}
                            height={400}
                        />
                    </div>
                </div>

                {/* Basic Info Section */}
                <div className="space-y-6">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Basic Information</h4>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required className="rounded-xl" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="headline">Headline</Label>
                        <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Computer Science Student at XYZ University" className="rounded-xl" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="min-h-[100px] resize-none rounded-xl"
                            placeholder="Tell us a little bit about yourself"
                        />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Kerala, India" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Personal Website</Label>
                            <Input id="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourwebsite.com" className="rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* Skills Section */}
                <div className="space-y-6">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Skills & Expertise</h4>

                    <div className="space-y-3">
                        <Label>Skills</Label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {skills.map(skill => (
                                <span key={skill} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                                    {skill}
                                    <button type="button" onClick={() => handleRemoveSkill(skill)} className="text-primary hover:text-primary/70">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2 max-w-sm">
                            <Input
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                placeholder="Add a skill (e.g. React, Python)"
                                className="rounded-xl"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddSkill();
                                    }
                                }}
                            />
                            <Button type="button" onClick={handleAddSkill} variant="secondary" className="rounded-xl gap-2">
                                <Plus className="h-4 w-4" /> Add
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Social Links */}
                <div className="space-y-6">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Social Profiles</h4>

                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="twitter">Twitter / X</Label>
                            <Input id="twitter" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://twitter.com/..." className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="linkedin">LinkedIn</Label>
                            <Input id="linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="github">GitHub</Label>
                            <Input id="github" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." className="rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="pt-6 border-t border-border/40 flex items-center gap-4 sticky bottom-6 bg-background/80 backdrop-blur-sm p-4 rounded-2xl border shadow-sm">
                    <Button type="submit" disabled={saving} className="gap-2 rounded-xl px-8 shadow-sm">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                    </Button>
                    {message && (
                        <p className={`text-sm font-medium ${message.type === 'success' ? 'text-emerald-500' : 'text-destructive'}`}>
                            {message.text}
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}
