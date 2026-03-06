"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    MapPin,
    Link as LinkIcon,
    Calendar,
    ArrowLeft,
    Users,
    Settings,
    UserPlus,
    UserCheck,
    Award,
    BookOpen,
    Info,
    CheckCircle2,
    Mail,
    Phone,
    Building2,
    CheckCircle,
    Trash2,
    Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePost } from "@/app/profile/post-actions";
import { toast } from "sonner";

interface ProfileViewProps {
    profile: any;
    posts: any[];
    memberships?: any[]; // Not really needed for institutions usually, but we keep the interface
    isOwnProfile: boolean;
    currentUser: any;
    isFollowing: boolean;
}

export function InstitutionProfileView({ profile, posts, isOwnProfile, currentUser, isFollowing }: ProfileViewProps) {
    const [activeTab, setActiveTab] = useState<"overview" | "courses" | "gallery" | "posts">("overview");

    const instDetails = profile.institution_profile_details || {};

    // Fallbacks if instDetails is empty
    const accreditations = instDetails.accreditations || [];
    const rankings = instDetails.rankings || [];
    const courses = instDetails.courses_offered || [];
    const gallery = instDetails.gallery_images || [];

    const topAccreditation = accreditations.length > 0 ? accreditations[0] : null;

    return (
        <div className="min-h-screen bg-background">
            {/* Institution Cover - More prominent than personal */}
            <div className="relative h-64 bg-slate-900 sm:h-80">
                {profile.cover_url ? (
                    <img
                        src={profile.cover_url}
                        alt="Campus Cover"
                        className="h-full w-full object-cover opacity-60 mix-blend-overlay"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 opacity-80" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                {/* Back button */}
                <div className="absolute left-4 top-4 z-10">
                    <Link href="/">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full bg-background/20 backdrop-blur-md text-white hover:bg-background/40"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {isOwnProfile && (
                    <div className="absolute right-4 top-4 z-10">
                        <Link href="/settings/profile">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full bg-background/20 backdrop-blur-md text-white hover:bg-background/40"
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Cover Content Overlay */}
                <div className="absolute bottom-0 left-0 w-full p-6 pt-20">
                    <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-end gap-6 pb-4">
                        {/* Logo */}
                        <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl border-4 border-background bg-white text-4xl font-bold shadow-2xl overflow-hidden relative z-10">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.display_name}
                                    className="h-full w-full object-contain p-2"
                                />
                            ) : (
                                <Building2 className="h-16 w-16 text-slate-300" />
                            )}
                        </div>

                        {/* Title Setup */}
                        <div className="flex-1 space-y-2 mb-2 relative z-10 w-full">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                                        {profile.display_name || profile.username || "Institution"}
                                        {profile.is_verified && <CheckCircle className="h-6 w-6 text-blue-500" />}
                                    </h1>
                                    <p className="text-lg text-muted-foreground mt-1 font-medium">
                                        {profile.headline || profile.bio || "Educational Institution"}
                                    </p>
                                </div>

                                {/* Quick Stats Badges */}
                                <div className="flex flex-wrap gap-2">
                                    {instDetails.established_year && (
                                        <div className="flex items-center gap-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border px-3 py-1 text-xs font-semibold shadow-sm">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                            Est. {instDetails.established_year}
                                        </div>
                                    )}
                                    {topAccreditation && (
                                        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600 shadow-sm">
                                            <Award className="h-3.5 w-3.5" />
                                            {topAccreditation.body} {topAccreditation.grade}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container mx-auto max-w-5xl px-4 py-6">

                {/* Actions & Meta Ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-6">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {profile.location && (
                            <span className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                {profile.location}
                            </span>
                        )}
                        {profile.website && (
                            <a href={profile.website} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-primary hover:underline font-medium">
                                <LinkIcon className="h-4 w-4" />
                                {(() => {
                                    try { return new URL(profile.website).hostname; }
                                    catch { return profile.website; }
                                })()}
                            </a>
                        )}
                        <span className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <strong className="text-foreground">{profile.followers_count || 0}</strong> Followers
                        </span>
                    </div>

                    <div className="flex gap-3">
                        {isOwnProfile ? (
                            <Link href="/settings/profile">
                                <Button className="gap-2 shadow-sm rounded-full">
                                    <Settings className="h-4 w-4" />
                                    Manage Campus
                                </Button>
                            </Link>
                        ) : currentUser ? (
                            <Button
                                variant={isFollowing ? "outline" : "default"}
                                className={`gap-2 rounded-full shadow-sm ${!isFollowing && "bg-primary text-primary-foreground"}`}
                            >
                                {isFollowing ? (
                                    <>
                                        <UserCheck className="h-4 w-4" />
                                        Following
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4" />
                                        Follow Institution
                                    </>
                                )}
                            </Button>
                        ) : null}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mt-6 border-b border-border/50">
                    <div className="flex overflow-x-auto gap-8 no-scrollbar">
                        {[
                            { id: "overview", label: "Overview", icon: Info },
                            { id: "courses", label: "Programs & Admissions", icon: BookOpen },
                            { id: "gallery", label: "Gallery", icon: ImageIcon },
                            { id: "posts", label: "Campus Updates", icon: Calendar },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 pb-4 text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? "border-b-2 border-primary text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content Panels */}
                <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3 md:items-start pb-20">

                    {/* Main Content Column (Takes 2/3 space on desktop) */}
                    <div className="md:col-span-2 space-y-8">

                        {activeTab === "overview" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {profile.bio && (
                                    <section>
                                        <h3 className="text-lg font-bold mb-3">About Us</h3>
                                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap rounded-2xl bg-muted/30 p-6 border border-border/50">
                                            {profile.bio}
                                        </p>
                                    </section>
                                )}

                                {accreditations.length > 0 && (
                                    <section>
                                        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                            Accreditations & Recognitions
                                        </h3>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            {accreditations.map((acc: any, i: number) => (
                                                <div key={i} className="rounded-xl border border-border/50 bg-card p-4 flex flex-col justify-center items-center text-center">
                                                    <span className="text-2xl font-bold text-foreground">{acc.grade}</span>
                                                    <span className="text-sm font-semibold text-muted-foreground">{acc.body} Valid Until {new Date(acc.valid_until).getFullYear()}</span>
                                                </div>
                                            ))}
                                            {rankings.map((rank: any, i: number) => (
                                                <div key={i} className="rounded-xl border border-border/50 bg-card p-4 flex flex-col justify-center items-center text-center">
                                                    <span className="text-2xl font-bold text-blue-500">#{rank.rank}</span>
                                                    <span className="text-sm font-semibold text-muted-foreground">{rank.organization} {rank.year}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}

                        {activeTab === "courses" && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {instDetails.admission_open && (
                                    <div className="rounded-2xl bg-primary/10 border border-primary/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                                <span className="relative flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                                </span>
                                                Admissions Open
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">Apply now for the upcoming academic year.</p>
                                        </div>
                                        {instDetails.admission_url && (
                                            <a href={instDetails.admission_url} target="_blank" rel="noopener">
                                                <Button className="rounded-full shadow-lg">Apply Now</Button>
                                            </a>
                                        )}
                                    </div>
                                )}

                                <h3 className="text-lg font-bold border-b border-border/50 pb-2">Academic Programs</h3>
                                {courses.length > 0 ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {courses.map((course: any, i: number) => (
                                            <div key={i} className="rounded-xl border border-border/50 bg-card p-5 hover:border-primary/50 transition-colors shadow-sm">
                                                <h4 className="font-bold text-base">{course.name}</h4>
                                                <p className="text-sm text-primary font-medium mt-1">{course.degree}</p>
                                                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                                                    <span>{course.duration}</span>
                                                    <span className="font-medium">{course.department}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center border border-dashed border-border/50 rounded-2xl bg-muted/10 text-muted-foreground">
                                        No course information available yet.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "gallery" && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {gallery.length > 0 ? (
                                    <div className="columns-1 sm:columns-2 gap-4 space-y-4">
                                        {gallery.map((img: any, i: number) => (
                                            <div key={i} className="relative group rounded-xl overflow-hidden break-inside-avoid">
                                                <img src={img.url} alt={img.caption || "Gallery"} className="w-full h-auto object-cover transform transition duration-500 group-hover:scale-105" />
                                                {img.caption && (
                                                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 pb-3">
                                                        <p className="text-white text-xs font-medium">{img.caption}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center border border-dashed border-border/50 rounded-2xl bg-muted/10 text-muted-foreground">
                                        <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        Gallery images will appear here.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "posts" && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {posts && posts.length > 0 ? (
                                    posts.map((post) => (
                                        <article
                                            key={post.id}
                                            className="rounded-2xl border border-border/50 bg-card p-5 transition-shadow hover:shadow-md"
                                        >
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap mb-4">
                                                {post.content}
                                            </p>
                                            {post.media && Array.isArray(post.media) && post.media.length > 0 && (
                                                <div className="grid gap-2 grid-cols-2 rounded-xl overflow-hidden">
                                                    {(post.media as { url: string; type: string }[]).slice(0, 4).map(
                                                        (m, idx) => (
                                                            <img
                                                                key={idx}
                                                                src={m.url}
                                                                alt="Post media"
                                                                className="object-cover h-48 w-full transition hover:opacity-90 cursor-pointer"
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            )}
                                            <div className="mt-4 pt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/30">
                                                <div className="flex items-center gap-4">
                                                    <time className="font-medium">
                                                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                                    </time>
                                                    <div className="flex gap-4">
                                                        {post.reactions_count > 0 && <span>{post.reactions_count} reactions</span>}
                                                        {post.comments_count > 0 && <span>{post.comments_count} comments</span>}
                                                    </div>
                                                </div>
                                                {isOwnProfile && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2 text-destructive hover:bg-destructive/10"
                                                        onClick={async () => {
                                                            if (confirm("Are you sure you want to delete this campus update?")) {
                                                                const res = await deletePost(post.id);
                                                                if (res.error) toast.error(res.error);
                                                                else toast.success("Update deleted");
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </article>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50">
                                        <Calendar className="h-10 w-10 text-muted-foreground/30 mb-2" />
                                        <p className="text-sm font-medium">No updates posted yet</p>
                                        {isOwnProfile && (
                                            <Link href="/create">
                                                <Button size="sm" className="mt-4 rounded-full shadow-sm">
                                                    Post an update
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Contact Card */}
                    <div className="md:col-span-1">
                        <div className="rounded-2xl border border-border/50 bg-card p-6 sticky top-24 shadow-sm">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Contact Info</h3>

                            <ul className="space-y-4 text-sm">
                                {instDetails.contact_email && (
                                    <li className="flex items-start gap-3">
                                        <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <a href={`mailto:${instDetails.contact_email}`} className="hover:underline text-foreground break-all">
                                            {instDetails.contact_email}
                                        </a>
                                    </li>
                                )}
                                {instDetails.contact_phone && (
                                    <li className="flex items-start gap-3">
                                        <Phone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <a href={`tel:${instDetails.contact_phone}`} className="hover:underline text-foreground">
                                            {instDetails.contact_phone}
                                        </a>
                                    </li>
                                )}
                                {profile.location && (
                                    <li className="flex items-start gap-3">
                                        <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <span className="text-foreground leading-tight">{profile.location}</span>
                                    </li>
                                )}
                            </ul>

                            {(!instDetails.contact_email && !instDetails.contact_phone && !profile.location) && (
                                <p className="text-muted-foreground text-xs text-center py-2">No contact information provided.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
