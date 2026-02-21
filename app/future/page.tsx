"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
    ArrowLeft,
    Wifi,
    Fingerprint,
    Radio,
    Smartphone,
    Bluetooth,
    Camera,
    Box,
    Globe,
    Glasses,
    Brain,
    MessageSquare,
    Shield,
    Zap,
    Cpu,
    BarChart3,
    BookOpen,
    Users,
    MapPin,
    Sparkles,
    ChevronRight,
    Layers,
    ScanFace,
    Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdaptiveLogo } from "@/components/shared/adaptive-logo";
import { ThemeToggle } from "@/components/theme-toggle";

gsap.registerPlugin(ScrollTrigger);

/* ────── Attendance Methods ────── */
const attendanceMethods = [
    {
        icon: Radio,
        title: "RFID Auto-Sense",
        description: "ESP32 + RC522 modules detect student ID cards as they pass through doorways. Zero interaction required — just walk in.",
        color: "from-blue-500 to-cyan-500",
        bgColor: "bg-blue-500/10",
        textColor: "text-blue-500",
        tags: ["Passive", "0ms Delay", "ESP32"],
    },
    {
        icon: Smartphone,
        title: "NFC Tap",
        description: "Students tap their phone or NFC card at a reader near the entrance. Instant verification with haptic feedback confirmation.",
        color: "from-emerald-500 to-teal-500",
        bgColor: "bg-emerald-500/10",
        textColor: "text-emerald-500",
        tags: ["Active", "< 1s", "NFC"],
    },
    {
        icon: Fingerprint,
        title: "Biometric Fingerprint",
        description: "Capacitive fingerprint scanners at classroom doors. Multi-finger enrollment for reliability. Anti-spoof detection built-in.",
        color: "from-violet-500 to-purple-500",
        bgColor: "bg-violet-500/10",
        textColor: "text-violet-500",
        tags: ["Biometric", "99.7% Accuracy", "Secure"],
    },
    {
        icon: ScanFace,
        title: "Facial Recognition",
        description: "AI-powered cameras identify students in real time as they enter. Works with masks using periocular recognition. Privacy-first with on-device processing.",
        color: "from-orange-500 to-amber-500",
        bgColor: "bg-orange-500/10",
        textColor: "text-orange-500",
        tags: ["AI", "Contactless", "On-Device"],
    },
    {
        icon: Bluetooth,
        title: "Bluetooth Beacon",
        description: "Low-energy beacons in classrooms detect the Arivolam app on student phones. Automatic check-in when within range for the duration of class.",
        color: "from-sky-500 to-blue-500",
        bgColor: "bg-sky-500/10",
        textColor: "text-sky-500",
        tags: ["BLE 5.0", "Auto", "Range-Based"],
    },
    {
        icon: Camera,
        title: "Motion Detection",
        description: "Thermal + motion sensors count and track occupancy in real time. Combined with IR for seat-level attendance tracking in large halls.",
        color: "from-rose-500 to-pink-500",
        bgColor: "bg-rose-500/10",
        textColor: "text-rose-500",
        tags: ["Thermal", "IR", "Occupancy"],
    },
];

/* ────── 3D Navigation Features ────── */
const navigation3DFeatures = [
    {
        icon: Box,
        title: "Digital Twin Campus",
        description: "Photorealistic 3D models of every building, floor, and room. Navigate indoors with sub-meter precision using Three.js and glTF models.",
    },
    {
        icon: Layers,
        title: "Multi-Floor Navigation",
        description: "Seamless floor transitions with elevator and staircase routing. Indoor positioning via Wi-Fi fingerprinting and BLE triangulation.",
    },
    {
        icon: MapPin,
        title: "Live Occupancy Overlay",
        description: "Real-time heat maps showing crowd density. Find empty study rooms, available lab seats, or the shortest cafeteria line.",
    },
    {
        icon: Activity,
        title: "Accessibility Routing",
        description: "Wheelchair-friendly paths, ramp locations, elevator priority, and audio-guided navigation for visually impaired students.",
    },
];

/* ────── AR/VR Features ────── */
const arVrFeatures = [
    {
        icon: Glasses,
        title: "AR Campus Explorer",
        description: "Point your phone at any building to see room schedules, department info, faculty offices, and live event feeds overlaid in augmented reality.",
        color: "from-indigo-500 to-violet-500",
    },
    {
        icon: Globe,
        title: "VR Campus Tours",
        description: "Prospective students can explore the entire campus in immersive VR from anywhere in the world. Walk through labs, libraries, and lecture halls.",
        color: "from-emerald-500 to-cyan-500",
    },
    {
        icon: BookOpen,
        title: "AR Learning Modules",
        description: "Interactive 3D anatomy models, molecular structures, mechanical assemblies, and historical recreations anchored to textbook pages.",
        color: "from-amber-500 to-orange-500",
    },
    {
        icon: Users,
        title: "Virtual Classrooms",
        description: "Spatial audio, avatar presence, shared whiteboards, and hand-tracked interactions. Attend lectures from home like you're sitting in the front row.",
        color: "from-pink-500 to-rose-500",
    },
];

/* ────── AI Features ────── */
const aiFeatures = [
    {
        icon: Brain,
        title: "Predictive Analytics",
        description: "ML models predict student performance, dropout risk, and course popularity. Proactive interventions before problems develop.",
    },
    {
        icon: MessageSquare,
        title: "AI Academic Advisor",
        description: "Personalized course recommendations based on career goals, learning style, GPA patterns, and industry demand. Multilingual support.",
    },
    {
        icon: Shield,
        title: "Smart Proctoring",
        description: "AI-monitored online exams with behavioral analysis, gaze tracking, and environment scanning. Fair, privacy-respecting integrity checks.",
    },
    {
        icon: BarChart3,
        title: "Automated Grading",
        description: "NLP-powered essay evaluation, code assessment with unit test generation, and math problem-solving verification. Instant, consistent feedback.",
    },
];

/* ────── Smart Infrastructure ────── */
const smartInfra = [
    { label: "Smart Lighting", desc: "Occupancy-based dimming", icon: Zap },
    { label: "HVAC Optimization", desc: "ML-driven climate control", icon: Activity },
    { label: "Energy Dashboard", desc: "Real-time consumption analytics", icon: BarChart3 },
    { label: "Edge Computing", desc: "On-campus fog nodes for <5ms latency", icon: Cpu },
    { label: "Digital Signage", desc: "Context-aware bulletin boards", icon: Layers },
    { label: "Emergency Alerts", desc: "Multi-channel instant broadcast", icon: Radio },
];

/* ────── Timeline ────── */
const timeline = [
    { phase: "Q2 2026", title: "Smart Attendance v1", desc: "RFID + NFC pilot at partner institutions", status: "next" },
    { phase: "Q3 2026", title: "3D Navigation Beta", desc: "Digital twin + indoor positioning for pilot campus", status: "planned" },
    { phase: "Q4 2026", title: "AR Campus Launch", desc: "AR building info overlay + AR learning modules", status: "planned" },
    { phase: "Q1 2027", title: "AI Advisor v1", desc: "Course recommendations + academic chatbot", status: "planned" },
    { phase: "Q2 2027", title: "Biometric Attendance", desc: "Fingerprint + facial recognition attendance", status: "planned" },
    { phase: "Q3 2027", title: "VR Campus Tours", desc: "Full immersive VR walkthroughs for admissions", status: "planned" },
    { phase: "Q4 2027", title: "Smart Infrastructure", desc: "IoT energy management + automated HVAC", status: "planned" },
    { phase: "2028+", title: "Full Digital Campus", desc: "AI + AR + IoT fully integrated campus ecosystem", status: "vision" },
];

export default function FuturePage() {
    const pageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero
            gsap.from(".hero-badge", { y: -20, opacity: 0, duration: 0.6, delay: 0.1 });
            gsap.from(".hero-title", { y: 30, opacity: 0, duration: 0.8, delay: 0.2 });
            gsap.from(".hero-sub", { y: 20, opacity: 0, duration: 0.6, delay: 0.4 });

            // Scroll-triggered sections
            gsap.utils.toArray<HTMLElement>(".reveal-section").forEach((section) => {
                gsap.from(section, {
                    y: 60,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    scrollTrigger: { trigger: section, start: "top 85%", toggleActions: "play none none none" },
                });
            });

            gsap.utils.toArray<HTMLElement>(".reveal-card").forEach((card, i) => {
                gsap.from(card, {
                    y: 40,
                    opacity: 0,
                    duration: 0.6,
                    delay: i * 0.08,
                    ease: "power3.out",
                    scrollTrigger: { trigger: card, start: "top 90%", toggleActions: "play none none none" },
                });
            });
        }, pageRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={pageRef} className="min-h-screen bg-background">
            {/* Nav */}
            <div className="fixed left-4 right-4 top-4 z-50 flex items-center justify-between md:left-8 md:right-8">
                <Link href="/about">
                    <Button variant="ghost" className="gap-2 rounded-xl bg-background/60 backdrop-blur-xl">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                </Link>
                <ThemeToggle />
            </div>

            {/* ══════════════ HERO ══════════════ */}
            <section className="relative overflow-hidden px-4 pb-16 pt-28 text-center md:pt-36">
                <div className="absolute inset-0 bg-gradient-animated" />
                <div className="absolute inset-0 bg-grid" />
                <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[150px]" />
                <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-[120px]" />

                <div className="relative z-10 mx-auto max-w-3xl">
                    <div className="hero-badge mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
                        <Sparkles className="h-3.5 w-3.5" /> Future Vision — 2026 & Beyond
                    </div>

                    <h1 className="hero-title text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                        The <span className="text-gradient">Next Generation</span>
                        <br />
                        Campus Experience
                    </h1>

                    <p className="hero-sub mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
                        From smart attendance that knows you&apos;re in class, to 3D navigation
                        and immersive AR/VR — here&apos;s how Arivolam is redefining education.
                    </p>
                </div>
            </section>

            <div className="container mx-auto max-w-5xl space-y-24 px-4 pb-24">
                {/* ══════════════ SMART ATTENDANCE ══════════════ */}
                <section className="reveal-section">
                    <div className="mb-8 text-center">
                        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500">
                            <Wifi className="h-3 w-3" /> Smart Attendance
                        </span>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                            Every Way to Mark Presence
                        </h2>
                        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                            Six distinct technologies — from zero-interaction RFID walk-through to AI facial recognition. Mix and match based on your campus needs.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {attendanceMethods.map((method) => (
                            <div
                                key={method.title}
                                className="reveal-card group rounded-2xl border border-border/40 bg-card p-5 transition-all duration-300 hover:border-border/60 hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${method.bgColor}`}>
                                    <method.icon className={`h-5 w-5 ${method.textColor}`} />
                                </div>
                                <h3 className="text-sm font-bold">{method.title}</h3>
                                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{method.description}</p>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {method.tags.map((tag) => (
                                        <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Architecture Diagram */}
                    <div className="reveal-card mt-8 rounded-2xl border border-border/40 bg-card p-6">
                        <h3 className="mb-4 text-sm font-bold">System Architecture</h3>
                        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
                            {[
                                { label: "Sensors", sub: "RFID / NFC / BLE / Camera", color: "bg-blue-500/10 text-blue-600" },
                                { label: "→", sub: "", color: "text-muted-foreground" },
                                { label: "Edge Gateway", sub: "ESP32 / Raspberry Pi", color: "bg-emerald-500/10 text-emerald-600" },
                                { label: "→", sub: "", color: "text-muted-foreground" },
                                { label: "MQTT Broker", sub: "HiveMQ / Mosquitto", color: "bg-violet-500/10 text-violet-600" },
                                { label: "→", sub: "", color: "text-muted-foreground" },
                                { label: "Supabase", sub: "Realtime + Postgres", color: "bg-orange-500/10 text-orange-600" },
                                { label: "→", sub: "", color: "text-muted-foreground" },
                                { label: "Arivolam", sub: "Dashboard + Alerts", color: "bg-primary/10 text-primary" },
                            ].map((node, i) =>
                                node.sub ? (
                                    <div key={i} className={`rounded-xl ${node.color} px-4 py-3 text-center`}>
                                        <p className="font-bold">{node.label}</p>
                                        <p className="mt-0.5 text-[10px] opacity-70">{node.sub}</p>
                                    </div>
                                ) : (
                                    <span key={i} className={`text-lg ${node.color}`}>{node.label}</span>
                                )
                            )}
                        </div>
                    </div>
                </section>

                {/* ══════════════ 3D NAVIGATION ══════════════ */}
                <section className="reveal-section">
                    <div className="mb-8 text-center">
                        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                            <Box className="h-3 w-3" /> 3D Navigation
                        </span>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                            Navigate Like Never Before
                        </h2>
                        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                            Photorealistic digital twins of your campus with real-time indoor positioning. Never get lost on the first day again.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {navigation3DFeatures.map((feature) => (
                            <div
                                key={feature.title}
                                className="reveal-card group rounded-2xl border border-border/40 bg-card p-5 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                                    <feature.icon className="h-5 w-5 text-emerald-500" />
                                </div>
                                <h3 className="text-sm font-bold">{feature.title}</h3>
                                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{feature.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tech Stack */}
                    <div className="reveal-card mt-6 flex flex-wrap items-center justify-center gap-2">
                        {["Three.js", "React Three Fiber", "glTF 2.0", "Wi-Fi RTT", "BLE Beacons", "A* Pathfinding", "WebGPU"].map((tech) => (
                            <span key={tech} className="rounded-full border border-border/50 bg-card px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-emerald-500/40 hover:text-emerald-600">
                                {tech}
                            </span>
                        ))}
                    </div>
                </section>

                {/* ══════════════ AR / VR ══════════════ */}
                <section className="reveal-section">
                    <div className="mb-8 text-center">
                        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-500">
                            <Glasses className="h-3 w-3" /> AR / VR
                        </span>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                            Immersive Experiences
                        </h2>
                        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                            Augmented and virtual reality that transforms how students learn, explore, and connect with their campus.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {arVrFeatures.map((feature) => (
                            <div
                                key={feature.title}
                                className="reveal-card group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${feature.color} opacity-[0.07] transition-opacity group-hover:opacity-[0.12]`} />
                                <div className="relative">
                                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
                                        <feature.icon className="h-5 w-5 text-violet-500" />
                                    </div>
                                    <h3 className="text-sm font-bold">{feature.title}</h3>
                                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Platform support */}
                    <div className="reveal-card mt-6 flex flex-wrap items-center justify-center gap-2">
                        {["WebXR", "Apple Vision Pro", "Meta Quest", "ARKit", "ARCore", "WebGL 2.0", "Spatial Audio"].map((tech) => (
                            <span key={tech} className="rounded-full border border-border/50 bg-card px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-violet-500/40 hover:text-violet-600">
                                {tech}
                            </span>
                        ))}
                    </div>
                </section>

                {/* ══════════════ AI-POWERED ══════════════ */}
                <section className="reveal-section">
                    <div className="mb-8 text-center">
                        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
                            <Brain className="h-3 w-3" /> AI-Powered
                        </span>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                            Intelligence Built In
                        </h2>
                        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                            Machine learning models that anticipate needs, personalize learning paths, and automate tedious administrative tasks.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {aiFeatures.map((feature) => (
                            <div
                                key={feature.title}
                                className="reveal-card group rounded-2xl border border-border/40 bg-card p-5 transition-all duration-300 hover:border-amber-500/30 hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10">
                                    <feature.icon className="h-5 w-5 text-amber-600" />
                                </div>
                                <h3 className="text-sm font-bold">{feature.title}</h3>
                                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ══════════════ SMART INFRASTRUCTURE ══════════════ */}
                <section className="reveal-section">
                    <div className="mb-8 text-center">
                        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-600">
                            <Cpu className="h-3 w-3" /> Smart Infrastructure
                        </span>
                        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                            The Connected Campus
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {smartInfra.map((item) => (
                            <div
                                key={item.label}
                                className="reveal-card rounded-xl border border-border/40 bg-card p-4 text-center transition-all duration-300 hover:border-cyan-500/30 hover:shadow-md hover:-translate-y-0.5"
                            >
                                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                                    <item.icon className="h-4 w-4 text-cyan-600" />
                                </div>
                                <h3 className="text-xs font-bold">{item.label}</h3>
                                <p className="mt-0.5 text-[10px] text-muted-foreground">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ══════════════ TIMELINE ══════════════ */}
                <section className="reveal-section">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Roadmap</h2>
                        <p className="mt-2 text-sm text-muted-foreground">Our phased rollout plan</p>
                    </div>

                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-[19px] top-0 h-full w-px bg-border sm:left-1/2 sm:-translate-x-px" />

                        <div className="space-y-6">
                            {timeline.map((item, i) => (
                                <div
                                    key={item.phase}
                                    className={`reveal-card relative flex items-start gap-4 sm:gap-8 ${i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                                        }`}
                                >
                                    {/* Content */}
                                    <div className={`flex-1 pl-10 sm:pl-0 ${i % 2 === 0 ? "sm:text-right" : "sm:text-left"}`}>
                                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${item.status === "next"
                                                ? "bg-primary/10 text-primary"
                                                : item.status === "vision"
                                                    ? "bg-violet-500/10 text-violet-500"
                                                    : "bg-muted text-muted-foreground"
                                            }`}>
                                            {item.phase}
                                        </span>
                                        <h3 className="mt-1 text-sm font-bold">{item.title}</h3>
                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                    </div>

                                    {/* Dot */}
                                    <div className="absolute left-2.5 top-1 sm:static sm:flex sm:shrink-0 sm:items-start">
                                        <div className={`h-4 w-4 rounded-full border-2 ${item.status === "next"
                                                ? "border-primary bg-primary/20"
                                                : item.status === "vision"
                                                    ? "border-violet-500 bg-violet-500/20"
                                                    : "border-border bg-muted"
                                            }`} />
                                    </div>

                                    {/* Spacer for alternating layout */}
                                    <div className="hidden flex-1 sm:block" />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════════════ CTA ══════════════ */}
                <section className="reveal-section text-center">
                    <div className="mx-auto max-w-md rounded-2xl border border-primary/20 bg-primary/5 p-8">
                        <AdaptiveLogo size={48} className="mx-auto mb-4" />
                        <h2 className="text-xl font-bold">Shape the Future with Us</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Interested in piloting these technologies at your institution?
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            <Link href="/contact">
                                <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                                    Partner With Us <ChevronRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/auth/signup">
                                <Button variant="outline" className="gap-2 rounded-xl">
                                    Join Arivolam <ChevronRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
