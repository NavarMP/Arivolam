"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    BookOpen, ShieldCheck, Users, GraduationCap, Building2, CalendarDays,
    Clock, FileText, CalendarCheck, Award, CalendarRange, ChevronRight,
    CheckCircle, ArrowRight, ChevronDown, Sparkles, UserPlus,
} from "lucide-react";

type GuideSection = {
    id: string;
    icon: any;
    title: string;
    description: string;
    color: string;
    bgColor: string;
    steps: { title: string; details: string }[];
};

const GUIDE_SECTIONS: GuideSection[] = [
    {
        id: "getting-started",
        icon: Sparkles,
        title: "Getting Started",
        description: "Quick overview of Campusolam and how to begin.",
        color: "text-violet-600 dark:text-violet-400",
        bgColor: "bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/50",
        steps: [
            { title: "Open Campusolam", details: "Navigate to your campus URL (e.g., yoursite.com/campus/your-campus-slug). You'll see the campus landing page." },
            { title: "Log in to your account", details: "Click 'Login' and enter your credentials (Register Number/Admission Number or Email + Password). Your role (Admin, Faculty, or Student) will be auto-detected." },
            { title: "Navigate using the sidebar", details: "Once logged in, use the sidebar on desktop or the bottom dock on mobile to access different sections — Dashboard, Academics, Calendar, Map, and more." },
        ],
    },
    {
        id: "admin-overview",
        icon: ShieldCheck,
        title: "Admin Overview",
        description: "What admins can do in Campusolam.",
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50",
        steps: [
            { title: "Admin Dashboard", details: "View a summary of student/faculty counts and pending enrollment approvals. Quick-link cards let you jump to any academic management section." },
            { title: "Manage Enrollments", details: "Go to 'User Management' to see all enrolled members. Approve or reject pending enrollment requests from students and faculty." },
            { title: "Full CRUD on Academic Entities", details: "Admins can create, edit, and delete: Semesters, Departments, Classes, Periods, Subjects, Student-Class Assignments, Events. Each has its own dedicated page accessible from the sidebar." },
        ],
    },
    {
        id: "semesters",
        icon: CalendarDays,
        title: "Managing Semesters",
        description: "Create and organize academic terms.",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50",
        steps: [
            { title: "Navigate to Semesters", details: "Go to Admin → Semesters from the sidebar." },
            { title: "Create a Semester", details: "Click 'Add Semester'. Fill in the name (e.g., 'Semester 1'), optional number, academic year (e.g., '2025-2026'), and start/end dates." },
            { title: "Edit or Delete", details: "Hover over any semester card to reveal Edit (pencil) and Delete (trash) icons. Click to modify or remove." },
        ],
    },
    {
        id: "departments",
        icon: Building2,
        title: "Managing Departments",
        description: "Set up academic departments.",
        color: "text-violet-600 dark:text-violet-400",
        bgColor: "bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/50",
        steps: [
            { title: "Navigate to Departments", details: "Go to Admin → Departments from the sidebar." },
            { title: "Create a Department", details: "Click 'Add Department'. Provide a name (e.g., 'Computer Science'), a code (e.g., 'CS'), an optional description, and optionally assign a Head of Department from the faculty list." },
            { title: "Edit or Delete", details: "Hover over a department card to see action buttons. ⚠️ Deleting a department will also remove all its classes and subjects." },
        ],
    },
    {
        id: "classes",
        icon: Users,
        title: "Managing Classes",
        description: "Create class sections within departments.",
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50",
        steps: [
            { title: "Prerequisites", details: "You must have at least one Department and one Semester created before you can create classes." },
            { title: "Create a Class", details: "Go to Admin → Classes, click 'Add Class'. Pick a department, a semester, give a name (e.g., 'CS-A'), an optional section letter, and set the max student capacity." },
            { title: "Classes link everything", details: "Students are assigned to classes. Faculty teach subjects in classes. Timetable and attendance are all organized by class." },
        ],
    },
    {
        id: "periods",
        icon: Clock,
        title: "Managing Periods / Hours",
        description: "Define daily time slots for the timetable.",
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50",
        steps: [
            { title: "Navigate to Periods", details: "Go to Admin → Periods from the sidebar." },
            { title: "Add Time Slots", details: "Click 'Add Period'. Name each slot (e.g., 'Period 1'), set start/end times (e.g., 9:00 AM – 9:50 AM), and set a sort order. Check 'This is a break' for lunch/tea breaks." },
            { title: "Ordered List", details: "Periods appear in order. Breaks are visually distinguished with a dashed border. Faculty will select these periods when marking attendance." },
        ],
    },
    {
        id: "subjects",
        icon: BookOpen,
        title: "Managing Subjects & Faculty Assignments",
        description: "Define subjects and assign faculty to teach them.",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50",
        steps: [
            { title: "Create Subjects", details: "Go to Admin → Subjects. Click 'Add Subject'. Provide name, code (e.g., CS301), department, optional semester, credits, and type (Theory/Lab/Elective/Project)." },
            { title: "Assign Faculty", details: "Switch to the 'Faculty Assignments' tab. Click 'Assign Faculty'. Select a faculty member, a subject, and a class. This creates a teaching assignment." },
            { title: "Faculty see their assignments", details: "Once assigned, faculty will see these subjects on their dashboard and can mark attendance and enter marks for them." },
        ],
    },
    {
        id: "students",
        icon: UserPlus,
        title: "Assigning Students to Classes",
        description: "Place enrolled students into their classes.",
        color: "text-indigo-600 dark:text-indigo-400",
        bgColor: "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50",
        steps: [
            { title: "Navigate to Students", details: "Go to Admin → Students from the sidebar." },
            { title: "Assign to Class", details: "Click 'Assign to Class'. Select a student from the enrolled list, pick their class, and optionally set a roll number. A student belongs to exactly one class." },
            { title: "Manage Assignments", details: "View all assigned students with search. Remove an assignment to reassign a student to a different class." },
        ],
    },
    {
        id: "events",
        icon: CalendarRange,
        title: "Managing Calendar Events",
        description: "Create institution-wide or department-specific events.",
        color: "text-rose-600 dark:text-rose-400",
        bgColor: "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50",
        steps: [
            { title: "Navigate to Events", details: "Go to Admin → Events from the sidebar." },
            { title: "Create an Event", details: "Click 'Add Event'. Set a title, type (Exam, Holiday, Meeting, Seminar, etc.), start/end date-time, location, and optional color." },
            { title: "Scope: Institution or Department", details: "Leave 'Scope' as 'Institution-wide' for all to see, or select a specific department to limit visibility." },
            { title: "Events appear on the Calendar page", details: "All events show on the dynamic Calendar page, visible to all campus members." },
        ],
    },
    {
        id: "faculty-attendance",
        icon: CalendarCheck,
        title: "Faculty: Marking Attendance",
        description: "How faculty mark daily attendance per period.",
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50",
        steps: [
            { title: "Go to Attendance", details: "Faculty → Attendance from the sidebar." },
            { title: "Select Date, Class, and Period", details: "Pick a date, select your class, then choose the period/hour. The student list loads automatically." },
            { title: "Mark each student", details: "For each student, tap one of: P (Present), A (Absent), L (Late), OD (On Duty), LV (Leave). Use 'All Present' or 'All Absent' for quick bulk marking." },
            { title: "Submit", details: "Click 'Submit Attendance'. Records are saved and can be updated by re-selecting the same date/class/period." },
        ],
    },
    {
        id: "faculty-marks",
        icon: FileText,
        title: "Faculty: Entering Marks",
        description: "Create exams and enter student marks.",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50",
        steps: [
            { title: "Go to Marks Entry", details: "Faculty → Marks Entry from the sidebar." },
            { title: "Create an Exam", details: "Click 'Create Exam'. Choose the type (Internal, External, Assignment, Seminar, Project, Lab), set the name, max marks, subject, and class." },
            { title: "Enter Marks", details: "Click an exam from the left panel. The student list loads. Enter marks for each student. Check 'Absent' if needed." },
            { title: "Save and Publish", details: "Click 'Save Marks'. To make marks visible to students, click the eye icon to publish. Unpublish to hide them again." },
        ],
    },
    {
        id: "student-view",
        icon: GraduationCap,
        title: "Student: Viewing Your Data",
        description: "How students access their attendance, marks, and more.",
        color: "text-indigo-600 dark:text-indigo-400",
        bgColor: "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50",
        steps: [
            { title: "Dashboard", details: "After login, the student dashboard shows your class, attendance record count, and quick links to view attendance and marks." },
            { title: "My Attendance", details: "Student → My Attendance shows your overall attendance percentage, per-subject breakdown with progress bars, and a record-by-record list." },
            { title: "My Marks", details: "Student → My Marks shows your overall score, subject-wise performance, and individual exam results. Only published marks are shown." },
            { title: "Academics & Calendar", details: "View all departments, subjects, and the campus calendar from the sidebar — available to all logged-in users." },
        ],
    },
];

export default function GuideClient() {
    const [expandedSection, setExpandedSection] = useState<string | null>("getting-started");

    const toggleSection = (id: string) => {
        setExpandedSection(prev => prev === id ? null : id);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Hero */}
            <div className="text-center space-y-4 py-8">
                <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-lg">
                        <BookOpen className="h-8 w-8" />
                    </div>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-blue-600 to-emerald-500 bg-clip-text text-transparent">
                    How to Use Campusolam
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    A complete guide to managing your campus — from setting up departments and classes to marking attendance and viewing performance.
                </p>
            </div>

            {/* Role Quick Nav */}
            <div className="grid gap-3 md:grid-cols-3 mb-8">
                <Card className="cursor-pointer hover:shadow-lg transition-all border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10"
                    onClick={() => { document.getElementById("admin-overview")?.scrollIntoView({ behavior: "smooth" }); setExpandedSection("admin-overview"); }}>
                    <CardContent className="flex items-center gap-3 py-4">
                        <ShieldCheck className="h-5 w-5 text-red-500" />
                        <div>
                            <p className="font-semibold text-sm">Admin Guide</p>
                            <p className="text-xs text-muted-foreground">Setup & manage everything</p>
                        </div>
                        <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-lg transition-all border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/10"
                    onClick={() => { document.getElementById("faculty-attendance")?.scrollIntoView({ behavior: "smooth" }); setExpandedSection("faculty-attendance"); }}>
                    <CardContent className="flex items-center gap-3 py-4">
                        <Users className="h-5 w-5 text-emerald-500" />
                        <div>
                            <p className="font-semibold text-sm">Faculty Guide</p>
                            <p className="text-xs text-muted-foreground">Attendance & marks</p>
                        </div>
                        <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-lg transition-all border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/10"
                    onClick={() => { document.getElementById("student-view")?.scrollIntoView({ behavior: "smooth" }); setExpandedSection("student-view"); }}>
                    <CardContent className="flex items-center gap-3 py-4">
                        <GraduationCap className="h-5 w-5 text-indigo-500" />
                        <div>
                            <p className="font-semibold text-sm">Student Guide</p>
                            <p className="text-xs text-muted-foreground">View attendance & performance</p>
                        </div>
                        <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardContent>
                </Card>
            </div>

            {/* Sections */}
            <div className="space-y-4">
                {GUIDE_SECTIONS.map((section, sectionIdx) => {
                    const Icon = section.icon;
                    const isExpanded = expandedSection === section.id;

                    return (
                        <Card key={section.id} id={section.id} className={`transition-all ${isExpanded ? section.bgColor + " shadow-md" : "hover:shadow-md"}`}>
                            <CardHeader
                                className="cursor-pointer select-none"
                                onClick={() => toggleSection(section.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm border`}>
                                            <Icon className={`h-5 w-5 ${section.color}`} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground font-normal">{sectionIdx + 1}.</span>
                                                {section.title}
                                            </CardTitle>
                                            <CardDescription className="text-xs mt-0.5">{section.description}</CardDescription>
                                        </div>
                                    </div>
                                    <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                </div>
                            </CardHeader>

                            {isExpanded && (
                                <CardContent className="pt-0 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-4 ml-2">
                                        {section.steps.map((step, stepIdx) => (
                                            <div key={stepIdx} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${section.color} bg-background border shadow-sm`}>
                                                        {stepIdx + 1}
                                                    </div>
                                                    {stepIdx < section.steps.length - 1 && (
                                                        <div className="w-px flex-1 bg-border mt-1" />
                                                    )}
                                                </div>
                                                <div className="pb-4">
                                                    <h4 className="font-semibold text-sm">{step.title}</h4>
                                                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{step.details}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Footer / Tips */}
            <Card className="bg-gradient-to-r from-violet-50 via-blue-50 to-emerald-50 dark:from-violet-950/20 dark:via-blue-950/20 dark:to-emerald-950/20 border-violet-100 dark:border-violet-900/50">
                <CardContent className="py-6 text-center space-y-3">
                    <h3 className="font-bold text-lg flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        Quick Setup Checklist
                    </h3>
                    <div className="text-sm text-muted-foreground max-w-lg mx-auto space-y-1 text-left">
                        <p>✅ <strong>Step 1:</strong> Admin creates Semesters</p>
                        <p>✅ <strong>Step 2:</strong> Admin creates Departments</p>
                        <p>✅ <strong>Step 3:</strong> Admin creates Classes (needs dept + semester)</p>
                        <p>✅ <strong>Step 4:</strong> Admin defines Periods/Hours</p>
                        <p>✅ <strong>Step 5:</strong> Admin adds Subjects and assigns Faculty</p>
                        <p>✅ <strong>Step 6:</strong> Admin assigns Students to Classes</p>
                        <p>✅ <strong>Step 7:</strong> Admin creates Calendar Events</p>
                        <p>✅ <strong>Step 8:</strong> Faculty marks Attendance & enters Marks</p>
                        <p>✅ <strong>Step 9:</strong> Students view their data!</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
