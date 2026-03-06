"use client";

import { useState } from "react";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { updateInstitutionProfile } from "./profile-actions";

export function InstitutionProfileSettings({ profile, institutionDetails }: { profile: any, institutionDetails: any }) {
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile fields
    const [displayName, setDisplayName] = useState(profile?.display_name || "");
    const [username, setUsername] = useState(profile?.username || "");
    const [headline, setHeadline] = useState(profile?.headline || "");
    const [bio, setBio] = useState(profile?.bio || "");
    const [location, setLocation] = useState(profile?.location || "");
    const [website, setWebsite] = useState(profile?.website || "");
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
    const [coverUrl, setCoverUrl] = useState(profile?.cover_url || "");

    // Institution specific fields
    const [institutionType, setInstitutionType] = useState(institutionDetails?.institution_type || "university");
    const [establishedYear, setEstablishedYear] = useState(institutionDetails?.established_year || "");
    const [affiliation, setAffiliation] = useState(institutionDetails?.affiliation || "");
    const [admissionUrl, setAdmissionUrl] = useState(institutionDetails?.admission_url || "");
    const [contactEmail, setContactEmail] = useState(institutionDetails?.contact_email || "");
    const [contactPhone, setContactPhone] = useState(institutionDetails?.contact_phone || "");

    // Arrays
    const [accreditations, setAccreditations] = useState<any[]>(institutionDetails?.accreditations || []);
    const [rankings, setRankings] = useState<any[]>(institutionDetails?.rankings || []);

    const handleAddAccreditation = () => {
        setAccreditations([...accreditations, { body: "", grade: "", valid_until: "" }]);
    };

    const handleUpdateAccreditation = (index: number, field: string, value: string) => {
        const updated = [...accreditations];
        updated[index] = { ...updated[index], [field]: value };
        setAccreditations(updated);
    }

    const handleRemoveAccreditation = (index: number) => {
        setAccreditations(accreditations.filter((_, i) => i !== index));
    }

    const handleAddRanking = () => {
        setRankings([...rankings, { organization: "", rank: "", year: new Date().getFullYear().toString() }]);
    };

    const handleUpdateRanking = (index: number, field: string, value: string) => {
        const updated = [...rankings];
        updated[index] = { ...updated[index], [field]: value };
        setRankings(updated);
    }

    const handleRemoveRanking = (index: number) => {
        setRankings(rankings.filter((_, i) => i !== index));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const result = await updateInstitutionProfile({
            display_name: displayName,
            username,
            headline,
            bio,
            location,
            website,
            avatar_url: avatarUrl,
            cover_url: coverUrl,
            institution_type: institutionType,
            established_year: establishedYear,
            affiliation,
            admission_url: admissionUrl,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            accreditations,
            rankings
        });

        if (result.error) {
            setMessage({ type: 'error', text: result.error });
        } else {
            setMessage({ type: 'success', text: 'Institution profile updated successfully!' });
        }

        setSaving(false);
    };

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h3 className="text-lg font-medium">Institution Profile</h3>
                <p className="text-sm text-muted-foreground">
                    This is your official campus showcase on the platform.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Images Section */}
                <div className="space-y-6">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Images</h4>

                    <div className="grid gap-8 md:grid-cols-2">
                        <ImageUpload
                            label="Institution Logo"
                            value={avatarUrl}
                            onChange={(url) => setAvatarUrl(url)}
                            aspectRatio={1}
                            bucket="avatars"
                            folder="profiles"
                            width={400}
                            height={400}
                            placeholder="Upload transparent vector or square logo"
                        />

                        <ImageUpload
                            label="Campus Cover Photo"
                            value={coverUrl}
                            onChange={(url) => setCoverUrl(url)}
                            aspectRatio={3}
                            bucket="avatars"
                            folder="covers"
                            width={1200}
                            height={400}
                            placeholder="Upload wide campus shot"
                        />
                    </div>
                </div>

                {/* Core Details */}
                <div className="space-y-6">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Core Details</h4>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Institution Name</Label>
                            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Handle/Username</Label>
                            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required className="rounded-xl" />
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="institutionType">Institution Type</Label>
                            <Select value={institutionType} onValueChange={setInstitutionType}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="university">University</SelectItem>
                                    <SelectItem value="college">College</SelectItem>
                                    <SelectItem value="school">School</SelectItem>
                                    <SelectItem value="polytechnic">Polytechnic</SelectItem>
                                    <SelectItem value="research_institute">Research Institute</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="establishedYear">Established Year</Label>
                            <Input id="establishedYear" type="number" value={establishedYear} onChange={(e) => setEstablishedYear(e.target.value)} placeholder="e.g. 1950" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="affiliation">Affiliation / Board</Label>
                            <Input id="affiliation" value={affiliation} onChange={(e) => setAffiliation(e.target.value)} placeholder="e.g. UGC / Calicut University" className="rounded-xl" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="headline">Subtitle / Tagline</Label>
                        <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. A premier institution for technology." className="rounded-xl" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">About Us (Bio)</Label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="min-h-[120px] resize-none rounded-xl"
                            placeholder="Extensive details about the campus, history, and vision..."
                        />
                    </div>
                </div>

                {/* Contact & Linking */}
                <div className="space-y-6">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Contact & Links</h4>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                            <Label htmlFor="location">Campus Location</Label>
                            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Kerala, India" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Official Website</Label>
                            <Input id="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactEmail">Public Email</Label>
                            <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="info@inst.edu" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactPhone">Public Phone</Label>
                            <Input id="contactPhone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91..." className="rounded-xl" />
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="admissionUrl">Admissions Portal URL</Label>
                            <Input id="admissionUrl" type="url" value={admissionUrl} onChange={(e) => setAdmissionUrl(e.target.value)} placeholder="https://..." className="rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* Accreditations Builder */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-border/50 pb-2">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground m-0 flex-1">Accreditations</h4>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddAccreditation} className="rounded-full gap-1 h-8">
                            <Plus className="h-3.5 w-3.5" /> Add New
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {accreditations.map((acc, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-4 items-end bg-muted/20 p-4 rounded-xl border border-border/50">
                                <div className="space-y-2 flex-1 w-full md:w-auto">
                                    <Label className="text-xs">Body</Label>
                                    <Input value={acc.body} onChange={(e) => handleUpdateAccreditation(index, 'body', e.target.value)} placeholder="e.g. NAAC / NBA" className="rounded-lg h-9" />
                                </div>
                                <div className="space-y-2 flex-1 w-full md:w-auto">
                                    <Label className="text-xs">Grade</Label>
                                    <Input value={acc.grade} onChange={(e) => handleUpdateAccreditation(index, 'grade', e.target.value)} placeholder="e.g. A++ / Tier-1" className="rounded-lg h-9" />
                                </div>
                                <div className="space-y-2 flex-1 w-full md:w-auto">
                                    <Label className="text-xs">Valid Until</Label>
                                    <Input value={acc.valid_until} type="date" onChange={(e) => handleUpdateAccreditation(index, 'valid_until', e.target.value)} className="rounded-lg h-9" />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveAccreditation(index)} className="text-destructive h-9 w-9 shrink-0">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {accreditations.length === 0 && (
                            <div className="text-sm text-muted-foreground text-center py-4 bg-muted/10 rounded-xl border border-dashed border-border/50">
                                No accreditations added yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Rankings Builder */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-border/50 pb-2">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground m-0 flex-1">Rankings</h4>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddRanking} className="rounded-full gap-1 h-8">
                            <Plus className="h-3.5 w-3.5" /> Add New
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {rankings.map((rank, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-4 items-end bg-muted/20 p-4 rounded-xl border border-border/50">
                                <div className="space-y-2 flex-1 w-full md:w-auto">
                                    <Label className="text-xs">Organization</Label>
                                    <Input value={rank.organization} onChange={(e) => handleUpdateRanking(index, 'organization', e.target.value)} placeholder="e.g. NIRF / QS World" className="rounded-lg h-9" />
                                </div>
                                <div className="space-y-2 flex-1 w-full md:w-auto">
                                    <Label className="text-xs">Rank</Label>
                                    <Input value={rank.rank} type="number" onChange={(e) => handleUpdateRanking(index, 'rank', e.target.value)} placeholder="e.g. 1" className="rounded-lg h-9" />
                                </div>
                                <div className="space-y-2 flex-1 w-full md:w-auto">
                                    <Label className="text-xs">Year</Label>
                                    <Input value={rank.year} type="number" onChange={(e) => handleUpdateRanking(index, 'year', e.target.value)} placeholder="e.g. 2024" className="rounded-lg h-9" />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveRanking(index)} className="text-destructive h-9 w-9 shrink-0">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {rankings.length === 0 && (
                            <div className="text-sm text-muted-foreground text-center py-4 bg-muted/10 rounded-xl border border-dashed border-border/50">
                                No rankings added yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit */}
                <div className="pt-6 border-t border-border/40 flex items-center gap-4 sticky bottom-6 bg-background/80 backdrop-blur-sm p-4 rounded-2xl border shadow-sm z-20">
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
