"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    Home,
    Compass,
    BookOpen,
    Calendar,
    LayoutGrid,
    User,
    ArrowLeft,
    ShieldCheck,
    GraduationCap,
    Users,
    ClipboardList,
    BarChart3,
    Bell,
    Settings,
    FileText,
    MessageSquare,
    Menu,
    ChevronRight,
    Clock,
    CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { DockNavigation, DockItem } from "@/components/layout/dock-navigation";
import { AIChatWidget } from "@/components/ai/chat-widget";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface CampusLayoutProps {
    children: React.ReactNode;
    institution: {
        id: string;
        name: string;
        slug: string;
        short_name: string | null;
        logo_url: string | null;
    };
    userRole: string;
    slug: string;
    campusContext?: {
        institutionName?: string;
        buildings?: { name: string; category: string; description?: string }[];
        pois?: { name: string; category: string }[];
    };
}

// Role-based sidebar navigation config
function getSidebarNav(slug: string, role: string) {
    const base = `/campus/${slug}`;

    const common = [
        { label: "Dashboard", href: base, icon: Home },
        { label: "Campus Map", href: `${base}/map`, icon: Compass },
        { label: "Calendar", href: `${base}/calendar`, icon: Calendar },
        { label: "Apps", href: `${base}/apps`, icon: LayoutGrid },
    ];

    const roleNav: Record<string, { label: string; icon: any; href: string }[]> = {
        student: [
            { label: "Dashboard", href: `${base}/student`, icon: Home },
            { label: "Academics", href: `${base}/academics`, icon: BookOpen },
            { label: "Timetable", href: `${base}/student/timetable`, icon: Calendar },
            { label: "Assignments", href: `${base}/student/assignments`, icon: ClipboardList },
            { label: "Grades", href: `${base}/student/grades`, icon: BarChart3 },
            { label: "My Attendance", href: `${base}/student/attendance`, icon: CalendarCheck },
            { label: "My Marks", href: `${base}/student/marks`, icon: FileText },
            { label: "Academics", href: `${base}/academics`, icon: BookOpen },
            { label: "Calendar", href: `${base}/calendar`, icon: Calendar },
            { label: "Campus Map", href: `${base}/map`, icon: Compass },
            { label: "Profile", href: `${base}/profile`, icon: User },
        ],
        faculty: [
            { label: "Dashboard", href: `${base}/faculty`, icon: Home },
            { label: "Attendance", href: `${base}/faculty/attendance`, icon: CalendarCheck },
            { label: "Marks Entry", href: `${base}/faculty/marks`, icon: FileText },
            { label: "Academics", href: `${base}/academics`, icon: BookOpen },
            { label: "Calendar", href: `${base}/calendar`, icon: Calendar },
            { label: "Campus Map", href: `${base}/map`, icon: Compass },
            { label: "Profile", href: `${base}/profile`, icon: User },
        ],
        admin: [
            { label: "Dashboard", href: `${base}/admin`, icon: Home },
            { label: "User Management", href: `${base}/admin/users`, icon: Users },
            { label: "Semesters", href: `${base}/admin/semesters`, icon: Calendar },
            { label: "Departments", href: `${base}/admin/departments`, icon: GraduationCap },
            { label: "Classes", href: `${base}/admin/classes`, icon: Users },
            { label: "Periods", href: `${base}/admin/periods`, icon: Clock },
            { label: "Subjects", href: `${base}/admin/subjects`, icon: BookOpen },
            { label: "Students", href: `${base}/admin/students`, icon: GraduationCap },
            { label: "Timetable", href: `${base}/admin/timetable`, icon: Calendar },
            { label: "Events", href: `${base}/admin/events`, icon: Calendar },
            { label: "Campus Map", href: `${base}/map`, icon: Compass },
            { label: "Profile", href: `${base}/profile`, icon: User },
        ],
    };

    return roleNav[role] || common;
}

// Dock items (mobile bottom nav) — simplified per role
function getDockItems(slug: string, role: string): DockItem[] {
    const base = `/campus/${slug}`;

    const items: DockItem[] = [
        { title: "Dashboard", icon: Home, href: role === "admin" ? `${base}/admin` : role === "faculty" ? `${base}/faculty` : `${base}/student` },
        { title: "Campus Map", icon: Compass, href: `${base}/map` },
        { title: "Academics", icon: BookOpen, href: `${base}/academics` },
        { title: "Calendar", icon: Calendar, href: `${base}/calendar` },
    ];

    if (role === "admin") {
        items.push({ title: "Admin", icon: ShieldCheck, href: `${base}/admin` });
    } else if (role === "faculty") {
        items.push({ title: "Classes", icon: GraduationCap, href: `${base}/faculty` });
    }

    items.push({ title: "Profile", icon: User, href: `${base}/profile` });

    return items;
}

export function CampusLayout({ children, institution, userRole, slug, campusContext }: CampusLayoutProps) {
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const sidebarNav = getSidebarNav(slug, userRole);
    const dockItems = getDockItems(slug, userRole);

    const SidebarLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
        <div className="space-y-1">
            {sidebarNav.map((item) => {
                const isActive =
                    pathname === item.href ||
                    (item.href !== `/campus/${slug}` && item.href !== `/campus/${slug}/student` && item.href !== `/campus/${slug}/faculty` && item.href !== `/campus/${slug}/admin` && pathname.startsWith(item.href));
                const isExactActive = pathname === item.href;

                return (
                    <Link key={item.href + item.label} href={item.href} onClick={onNavigate}>
                        <button
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isExactActive
                                ? "bg-primary/10 text-primary shadow-sm"
                                : isActive
                                    ? "bg-muted/50 text-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                        >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                            {isExactActive && (
                                <ChevronRight className="ml-auto h-3 w-3 text-primary" />
                            )}
                        </button>
                    </Link>
                );
            })}
        </div>
    );

    const roleColors: Record<string, string> = {
        student: "text-indigo-600 bg-indigo-500/10",
        faculty: "text-emerald-600 bg-emerald-500/10",
        admin: "text-rose-600 bg-rose-500/10",
    };
    const roleColorClass = roleColors[userRole] || "text-primary bg-primary/10";

    return (
        <div className="relative min-h-screen bg-background">
            {/* Subtle background grid */}
            <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
                <div className="flex items-center gap-3">
                    {/* Mobile hamburger */}
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full md:hidden">
                                <Menu className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0">
                            <SheetHeader className="border-b border-border/40 px-4 py-4">
                                <SheetTitle className="flex items-center gap-2 text-sm">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
                                        <img
                                            src={institution.logo_url || "/assets/Logo.svg"}
                                            alt={institution.short_name || institution.name}
                                            className="h-6 w-6 object-contain"
                                        />
                                    </div>
                                    <span className="truncate">{institution.short_name || institution.name}</span>
                                </SheetTitle>
                            </SheetHeader>
                            <div className="px-3 py-2">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${roleColorClass}`}>
                                    {userRole}
                                </span>
                            </div>
                            <nav className="px-3 pb-3">
                                <SidebarLinks onNavigate={() => setSidebarOpen(false)} />
                            </nav>
                        </SheetContent>
                    </Sheet>

                    <Link href="/campus">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>

                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
                            <img
                                src={institution.logo_url || "/assets/Logo.svg"}
                                alt={institution.short_name || institution.name}
                                className="h-7 w-7 object-contain"
                            />
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-sm font-semibold leading-tight">
                                {institution.short_name || institution.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                                {userRole}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="hidden text-xs text-muted-foreground md:block">
                        ⌘K to search
                    </span>
                    <ThemeToggle />
                </div>
            </header>

            <div className="flex">
                {/* Desktop sidebar */}
                <aside className="hidden w-56 shrink-0 border-r border-border/40 md:block">
                    <div className="sticky top-[57px] flex flex-col">
                        <div className="px-4 pt-4 pb-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${roleColorClass}`}>
                                {userRole} Panel
                            </span>
                        </div>
                        <nav className="flex-1 px-3 pb-4">
                            <SidebarLinks />
                        </nav>
                    </div>
                </aside>

                {/* Main content */}
                <main className="flex-1 pb-24 md:pb-8">
                    <div className="container mx-auto p-4 md:p-8">
                        {children}
                    </div>
                </main>
            </div>

            {/* AI Chat Widget */}
            <AIChatWidget campusContext={campusContext} />

            {/* Dock navigation (mobile only) */}
            <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 md:hidden">
                <DockNavigation items={dockItems} />
            </div>
        </div>
    );
}
