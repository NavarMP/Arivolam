"use client";

import { useState, useTransition } from "react";
import {
    Settings,
    Building2,
    Globe,
    MapPin,
    Palette,
    Loader2,
    Save,
    ExternalLink,
    Image as ImageIcon,
    Map,
    Lock,
    Link2,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { updateInstitutionDetails } from "./actions";

interface Institution {
    id: string;
    name: string;
    slug: string;
    short_name: string | null;
    logo_url: string | null;
    cover_url: string | null;
    description: string | null;
    website: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    primary_color: string | null;
    map_svg_url: string | null;
    google_maps_embed: string | null;
    map_access: string | null;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
}

interface Props {
    institution: Institution;
    slug: string;
}

export default function SettingsClient({ institution, slug }: Props) {
    const [isPending, startTransition] = useTransition();

    // Form state
    const [name, setName] = useState(institution.name);
    const [shortName, setShortName] = useState(institution.short_name || "");
    const [description, setDescription] = useState(institution.description || "");
    const [website, setWebsite] = useState(institution.website || "");
    const [address, setAddress] = useState(institution.address || "");
    const [city, setCity] = useState(institution.city || "");
    const [state, setState] = useState(institution.state || "");
    const [country, setCountry] = useState(institution.country || "India");
    const [primaryColor, setPrimaryColor] = useState(institution.primary_color || "#ef8119");
    const [logoUrl, setLogoUrl] = useState(institution.logo_url || "");
    const [coverUrl, setCoverUrl] = useState(institution.cover_url || "");
    const [mapAccess, setMapAccess] = useState(institution.map_access || "public");

    function handleSave() {
        if (!name.trim()) {
            toast.error("Institution name is required");
            return;
        }
        startTransition(async () => {
            const result = await updateInstitutionDetails(slug, {
                name: name.trim(),
                short_name: shortName.trim(),
                description: description.trim(),
                website: website.trim(),
                address: address.trim(),
                city: city.trim(),
                state: state.trim(),
                country: country.trim(),
                primary_color: primaryColor,
                logo_url: logoUrl.trim(),
                cover_url: coverUrl.trim(),
                map_access: mapAccess,
            });
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Settings saved successfully");
            }
        });
    }

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Settings className="h-6 w-6 text-slate-500" />
                    Campus Settings
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage your institution&apos;s details, branding, and configuration.
                </p>
            </div>

            {/* Preview Card */}
            <div className="rounded-2xl border border-border/50 overflow-hidden">
                {coverUrl ? (
                    <div className="h-32 relative">
                        <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
                    </div>
                ) : (
                    <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5" />
                )}
                <div className="px-6 pb-5 -mt-6 relative">
                    <div className="flex items-end gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background border border-border shadow-sm overflow-hidden">
                            {logoUrl ? (
                                <img src={logoUrl} alt="" className="h-10 w-10 object-contain" />
                            ) : (
                                <Building2 className="h-7 w-7 text-muted-foreground" />
                            )}
                        </div>
                        <div className="pb-1">
                            <h2 className="text-lg font-semibold">{name || "Your Institution"}</h2>
                            <p className="text-xs text-muted-foreground">/{slug}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Institution Info Section ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Building2 className="h-4 w-4 text-blue-500" />
                    Institution Information
                </div>
                <div className="grid gap-4 rounded-2xl border border-border/50 bg-card p-5">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Institution Name *</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., SAFI Institute of Advanced Study" className="rounded-xl" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="short_name">Short Name / Abbreviation</Label>
                            <Input id="short_name" value={shortName} onChange={e => setShortName(e.target.value)} placeholder="e.g., SIAS" className="rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="website">Website</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input id="website" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.edu" className="pl-9 rounded-xl" />
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of your institution..." rows={3} className="rounded-xl resize-none" />
                    </div>
                </div>
            </section>

            {/* ── Location Section ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                    Location
                </div>
                <div className="grid gap-4 rounded-2xl border border-border/50 bg-card p-5">
                    <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address" className="rounded-xl" />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="city">City</Label>
                            <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="state">State</Label>
                            <Input id="state" value={state} onChange={e => setState(e.target.value)} placeholder="State" className="rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="country">Country</Label>
                            <Input id="country" value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" className="rounded-xl" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Branding Section ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Palette className="h-4 w-4 text-violet-500" />
                    Branding
                </div>
                <div className="grid gap-4 rounded-2xl border border-border/50 bg-card p-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="logo_url">Logo URL</Label>
                            <div className="relative">
                                <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input id="logo_url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." className="pl-9 rounded-xl" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="cover_url">Cover Image URL</Label>
                            <div className="relative">
                                <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input id="cover_url" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..." className="pl-9 rounded-xl" />
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="primary_color">Brand Color</Label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                id="primary_color"
                                value={primaryColor}
                                onChange={e => setPrimaryColor(e.target.value)}
                                className="h-10 w-14 rounded-lg border border-border cursor-pointer"
                            />
                            <Input
                                value={primaryColor}
                                onChange={e => setPrimaryColor(e.target.value)}
                                placeholder="#ef8119"
                                className="max-w-[140px] rounded-xl font-mono text-sm"
                            />
                            <div className="h-8 flex-1 rounded-lg" style={{ backgroundColor: primaryColor }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Map Access Section ── */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Map className="h-4 w-4 text-cyan-500" />
                    Campus Map Access
                </div>
                <div className="grid gap-3 rounded-2xl border border-border/50 bg-card p-5">
                    <p className="text-xs text-muted-foreground">Control who can view your interactive campus map.</p>
                    {[
                        { value: "public", label: "Public", desc: "Anyone can view the campus map", icon: Eye },
                        { value: "private", label: "Private", desc: "Only enrolled members can view", icon: Lock },
                        { value: "link_only", label: "Link Only", desc: "Only accessible via direct link", icon: Link2 },
                    ].map(opt => (
                        <label
                            key={opt.value}
                            className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${mapAccess === opt.value ? "border-cyan-500/50 bg-cyan-500/5" : "border-border/50 hover:border-border"
                                }`}
                        >
                            <input
                                type="radio"
                                name="map_access"
                                value={opt.value}
                                checked={mapAccess === opt.value}
                                onChange={() => setMapAccess(opt.value)}
                                className="accent-cyan-500"
                            />
                            <opt.icon className={`h-4 w-4 shrink-0 ${mapAccess === opt.value ? "text-cyan-500" : "text-muted-foreground"}`} />
                            <div>
                                <p className="text-sm font-medium">{opt.label}</p>
                                <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </section>

            {/* ── Meta Info ── */}
            <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-card p-5">
                <div className="text-xs text-muted-foreground space-y-1">
                    <p>Slug: <span className="font-mono text-foreground">{slug}</span></p>
                    <p>Created: {new Date(institution.created_at).toLocaleDateString()}</p>
                    <p>Last Updated: {new Date(institution.updated_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                    {institution.is_verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Verified
                        </span>
                    )}
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2 pb-8">
                <Button onClick={handleSave} disabled={isPending} size="lg" className="gap-2 rounded-xl px-8">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </Button>
            </div>
        </div>
    );
}
