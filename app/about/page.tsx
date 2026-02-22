"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
    ArrowLeft,
    BookOpen,
    Globe,
    Lightbulb,
    Target,
    Eye,
    Palette,
    Cpu,
    Wifi,
    Box,
    Compass,
    ArrowRight,
    Layers,
    Triangle,
    Circle,
    Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdaptiveLogo } from "@/components/shared/adaptive-logo";
import { ThemeToggle } from "@/components/theme-toggle";

gsap.registerPlugin(ScrollTrigger);

const team = [
    {
        name: "Muhammed Navar",
        role: "Architect",
        avatar: "https://api.dicebear.com/9.x/notionists/svg?hair=hat&lips=variant17&seed=Navar&backgroundColor=b6e3f4",
        bio: "System design, platform architecture, and full-stack development",
    },
    {
        name: "Muhammed Rabeeh",
        role: "Catalyst",
        avatar: "https://api.dicebear.com/9.x/notionists/svg?hair=variant06&nose=variant13&seed=Rabeeh&backgroundColor=c0aede",
        bio: "Driving innovation and energizing the team forward",
    },
    {
        name: "Muhammed H",
        role: "Visionary",
        avatar: "https://api.dicebear.com/9.x/notionists/svg?glasses=variant01&body=variant07&seed=MuhammedH&backgroundColor=ffd5dc",
        bio: "Future vision, product direction, and creative strategy",
    },
    {
        name: "Abdulla Ahmed",
        role: "Strategist",
        avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Abdulla&backgroundColor=d1f4d1",
        bio: "Business strategy, growth planning, and partnerships",
    },
];

const brandColors = [
    { name: "Brand Blue", hex: "#012d49", hsl: "203° 97% 15%" },
    { name: "Brand Orange", hex: "#ef8119", hsl: "29° 88% 52%" },
    { name: "Deep Blue", hex: "#001a2e", hsl: "203° 100% 9%" },
    { name: "Light Accent", hex: "#e8edf2", hsl: "214° 30% 93%" },
];

const roadmap = [
    {
        phase: "Current",
        title: "Social Campus Platform",
        description: "Feed, profiles, institution management, and campus ERP",
        icon: Globe,
        status: "live",
    },
    {
        phase: "Phase 2",
        title: "IoT RFID Attendance",
        description: "ESP32 + RFID smart attendance tracking at campus entrances",
        icon: Wifi,
        status: "planned",
    },
    {
        phase: "Phase 3",
        title: "3D Campus Navigation",
        description: "Interactive 3D maps with building walk-throughs and wayfinding",
        icon: Box,
        status: "concept",
    },
    {
        phase: "Phase 4",
        title: "AR/VR Immersive Tours",
        description: "Virtual reality campus tours and augmented reality classrooms",
        icon: Compass,
        status: "concept",
    },
];

export default function AboutPage() {
    const heroRef = useRef<HTMLDivElement>(null);
    const sectionRefs = useRef<(HTMLElement | null)[]>([]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero entrance
            gsap.from(".hero-logo", { y: -40, opacity: 0, duration: 1, ease: "power3.out" });
            gsap.from(".hero-title", { y: 30, opacity: 0, duration: 0.8, delay: 0.3, ease: "power3.out" });
            gsap.from(".hero-subtitle", { y: 20, opacity: 0, duration: 0.8, delay: 0.5, ease: "power3.out" });

            // Section reveals
            sectionRefs.current.forEach((section) => {
                if (!section) return;
                const reveals = section.querySelectorAll(".reveal");
                gsap.set(reveals, { y: 40, opacity: 0 }); // set initial state immediately, no flash
                gsap.to(reveals, {
                    y: 0,
                    opacity: 1,
                    stagger: 0.1,
                    duration: 0.6,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 80%",
                    },
                });
            });
        }, heroRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={heroRef} className="min-h-screen bg-background">
            {/* Nav */}
            <div className="fixed left-4 right-4 top-4 z-50 flex items-center justify-between md:left-8 md:right-8">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 rounded-xl bg-background/60 backdrop-blur-xl">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </Link>
                <ThemeToggle />
            </div>

            {/* Hero */}
            <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center">
                {/* Background glow */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 opacity-50 blur-[150px]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
                </div>

                <div className="relative z-10">
                    <div className="hero-logo flex justify-center mb-6">
                        <AdaptiveLogo size={400} />
                    </div>
                    <h1 className="hero-title mb-4 text-5xl font-bold tracking-tight sm:text-7xl">
                        Arivolam
                    </h1>
                    <div className="hero-subtitle space-y-2">
                        <p className="text-xl text-muted-foreground sm:text-2xl">
                            <span className="font-semibold text-primary">അറിവോളം</span>
                            <span className="mx-2 text-border">|</span>
                            അറിവ് + ഓളം
                        </p>
                        <p className="text-lg text-muted-foreground">
                            The <span className="font-semibold text-foreground">Wave of Knowledge</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section
                ref={(el) => { sectionRefs.current[0] = el; }}
                className="container mx-auto max-w-4xl px-4 py-16"
            >
                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="reveal rounded-2xl border border-border/40 bg-card p-8">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <Target className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold">Our Mission</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            To create a unified digital campus ecosystem that empowers educational institutions with modern social networking,
                            smart management tools, and innovative technology — connecting students, faculty, and communities on a single platform.
                        </p>
                    </div>
                    <div className="reveal rounded-2xl border border-border/40 bg-card p-8">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                            <Eye className="h-6 w-6 text-emerald-500" />
                        </div>
                        <h3 className="mb-2 text-xl font-bold">Our Vision</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            A world where every educational institution operates at the forefront of technology — where campus management meets
                            social innovation, bringing IoT, AR/VR, and AI to education for a smarter, more connected campus experience.
                        </p>
                    </div>
                </div>
            </section>

            {/* Brand Story */}
            <section
                ref={(el) => { sectionRefs.current[1] = el; }}
                className="container mx-auto max-w-3xl px-4 py-16"
            >
                <div className="reveal text-center">
                    <div className="mb-4 flex items-center justify-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <h2 className="text-2xl font-bold">The Name</h2>
                    </div>
                    <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">
                        <strong className="text-foreground">Arivolam</strong> (അറിവോളം) is a Malayalam word combining{" "}
                        <em className="text-primary">അറിവ്</em> (Knowledge) and{" "}
                        <em className="text-primary">ഓളം</em> (Wave/Horizon).
                        It represents the boundless wave of knowledge that flows through campuses,
                        connecting minds and building communities across the educational landscape.
                    </p>
                </div>
            </section>

            {/* Anatomy of the Logo & Brand Identity */}
            <section
                ref={(el) => { sectionRefs.current[2] = el; }}
                className="flex flex-col gap-8 container mx-auto max-w-5xl px-4 py-16"
            >
                <div className="reveal mb-12 text-center">
                    <Layers className="mx-auto mb-3 h-6 w-6 text-primary" />
                    <h2 className="text-3xl font-bold tracking-tight">Brand Identity & Logo Anatomy</h2>
                    <p className="mt-2 text-sm text-muted-foreground">The meaning behind the shapes, colors, and structure of Arivolam.</p>
                </div>

                <div className="flex flex-col gap-8 lg:flex-row lg:gap-12 lg:items-stretch">
                    {/* Visual Side */}
                    <div className="flex w-full flex-col lg:w-5/12">
                        {/* Structure Image */}
                        <div className="reveal relative flex items-center justify-center rounded-3xl border border-border/40 bg-white p-8 overflow-hidden dark:bg-[#e4ebf1] h-full">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]" />
                            <div className="relative z-10 w-full transition-transform duration-700 hover:scale-105">
                                <img src="/assets/Logo Structure.svg" alt="Logo Structure" className="w-full h-auto drop-shadow-xl" />
                            </div>
                        </div>
                    </div>

                    {/* Content Side */}
                    <div className="flex w-full flex-col gap-6 lg:w-7/12 h-full">
                        {/* Literal Representation */}
                        <div className="reveal rounded-3xl border border-border/40 bg-card p-6 sm:p-8">
                            <h3 className="mb-5 text-lg font-bold flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <p className="font-serif italic text-xl font-bold">A</p>
                                </span>
                                Literal Representation: A + O
                            </h3>
                            <div className="space-y-5">
                                <div className="flex gap-4">
                                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                                        <Triangle className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold">The "A" (അറിവ് / Ariv) - Knowledge</h4>
                                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">The top dark blue chevron (the upward-pointing triangle) serves as the stylized letter "A." It forms the peak or the structural foundation of the top half.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                                        <Circle className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold">The "O" (ഓളം / Olam) - Wave</h4>
                                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">The bottom dark blue rounded oval represents the letter "O," grounding the logo.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Symbolic Meaning */}
                        <div className="reveal rounded-3xl border border-border/40 bg-card p-6 sm:p-8">
                            <h3 className="mb-5 text-lg font-bold flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                                    <Zap className="h-5 w-5 text-orange-500" />
                                </div>
                                The Symbolic Meaning
                            </h3>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" /> Horizon & Peak</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">The "A" shape mimics a mountain peak or horizon, connecting to "The horizon of learning." It points upward, symbolizing growth, aspiration, and academic elevation.</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold flex items-center gap-2"><ArrowRight className="h-4 w-4 text-orange-500" /> Wave of Knowledge</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">The orange curve visually disrupts the rigid blue triangle with a dynamic, flowing shape, representing a continuous, moving wave of learning.</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold flex items-center gap-2"><ArrowRight className="h-4 w-4 text-orange-500" /> Community Connect</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">The curve strongly resembles a welcoming smile or open arms, injecting human connection and a student community feel into the ERP system.</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" /> The Closed Loop</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">The solid "O" base forms a sturdy foundation or continuous loop, representing the "all-in-one" enclosed campus ecosystem bringing ERP and social together.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
                    {/* Standard Logo & Colors */}
                    <div className="reveal flex flex-col gap-6 rounded-3xl border border-border/40 bg-card p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white p-3 shadow-inner dark:bg-gray-900 border border-border/50">
                                <AdaptiveLogo size={40} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold">Standard Mark</h3>
                                <p className="text-[10px] text-muted-foreground leading-tight">Dynamic theme-adaptive SVG used across the platform.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                <Palette className="h-3 w-3" /> Color Palette
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                {brandColors.map((color) => (
                                    <motion.div
                                        key={color.hex}
                                        whileHover={{ scale: 1.02 }}
                                        className="group flex flex-col cursor-pointer rounded-xl border border-border/30 p-2 transition-shadow hover:shadow-md"
                                    >
                                        <div className="mb-2 h-8 w-full rounded-lg border border-black/5 dark:border-white/5" style={{ backgroundColor: color.hex }} />
                                        <p className="text-[10px] font-bold">{color.name}</p>
                                        <p className="text-[9px] text-muted-foreground font-mono">{color.hex}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Color Psychology */}
                    <div className="reveal rounded-3xl border border-border/40 bg-card p-6 sm:p-8">
                        <h3 className="mb-5 text-lg font-bold flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                <Palette className="h-5 w-5 text-primary" />
                            </div>
                            Color Psychology
                        </h3>
                        <div className="space-y-5">
                            <div className="flex items-center gap-4 border-b border-border/50 pb-4">
                                <div className="h-12 w-12 shrink-0 rounded-full bg-[#012d49] shadow-[0_0_15px_rgba(1,45,73,0.3)] shadow-inner" />
                                <div>
                                    <h4 className="text-sm font-bold">Dark Blue</h4>
                                    <p className="text-sm text-muted-foreground">Traditionally represents trust, intelligence, stability, and technology. It grounds the logo, reflecting the reliability needed for an ERP system.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 pt-1">
                                <div className="h-12 w-12 shrink-0 rounded-full bg-[#ef8119] shadow-[0_0_15px_rgba(239,129,25,0.3)] shadow-inner" />
                                <div>
                                    <h4 className="text-sm font-bold">Vibrant Orange</h4>
                                    <p className="text-sm text-muted-foreground">Represents energy, enthusiasm, youth, and creativity. It highlights the dynamic, social, and engaging side of campus life.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section
                ref={(el) => { sectionRefs.current[3] = el; }}
                className="container mx-auto max-w-4xl px-4 py-16"
            >
                <div className="reveal mb-8 text-center">
                    <h2 className="text-2xl font-bold">The Team</h2>
                    <p className="text-sm text-muted-foreground">The minds behind Arivolam</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {team.map((member, i) => {
                        return (
                            <div
                                key={member.name}
                                className="reveal hover-lift group flex flex-col items-center rounded-2xl border border-border/40 bg-card p-6 text-center"
                            >
                                <div className="mb-4 h-20 w-20 overflow-hidden rounded-2xl border-2 border-border/40 shadow-sm transition-shadow group-hover:shadow-md">
                                    <img
                                        src={member.avatar}
                                        alt={member.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <h3 className="text-sm font-bold">{member.name}</h3>
                                <p className="mb-1 text-xs font-semibold text-primary">{member.role}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{member.bio}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Future Roadmap */}
            <section
                ref={(el) => { sectionRefs.current[4] = el; }}
                className="container mx-auto max-w-3xl px-4 py-16"
            >
                <div className="reveal mb-8 text-center">
                    <Lightbulb className="mx-auto mb-2 h-5 w-5 text-primary" />
                    <h2 className="text-2xl font-bold">Future Roadmap</h2>
                    <p className="text-sm text-muted-foreground">Where we&apos;re headed</p>
                </div>
                <div className="relative space-y-4">
                    {/* Vertical line */}
                    <div className="absolute left-6 top-4 bottom-4 w-px bg-border sm:left-8" />

                    {roadmap.map((item, i) => (
                        <div key={item.phase} className="reveal relative flex gap-4 sm:gap-6">
                            <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-16 sm:w-16 ${item.status === "live"
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                                : item.status === "planned"
                                    ? "bg-primary/15 text-primary"
                                    : "bg-muted text-muted-foreground"
                                }`}>
                                <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="flex-1 rounded-xl border border-border/40 bg-card p-4 sm:p-5">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${item.status === "live"
                                        ? "text-primary"
                                        : item.status === "planned"
                                            ? "text-amber-500"
                                            : "text-muted-foreground"
                                        }`}>
                                        {item.status === "live" ? "🟢 Live" : item.status === "planned" ? "🟡 Planned" : "💡 Concept"}
                                    </span>
                                </div>
                                <h3 className="mt-1 text-sm font-bold">{item.title}</h3>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA to future pages */}
                <div className="reveal mt-8 text-center">
                    <Link href="/future">
                        <Button variant="outline" className="gap-2 rounded-xl">
                            <Cpu className="h-4 w-4" />
                            Explore Future Tech
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="container mx-auto max-w-2xl px-4 py-16 text-center">
                <h2 className="mb-3 text-2xl font-bold">Ready to join the wave?</h2>
                <p className="mb-6 text-sm text-muted-foreground">
                    Create your account and start your campus journey on Arivolam.
                </p>
                <div className="flex justify-center gap-3">
                    <Link href="/auth/signup">
                        <Button className="rounded-xl px-8 font-semibold shadow-lg shadow-primary/20">
                            Get Started
                        </Button>
                    </Link>
                    <Link href="/contact">
                        <Button variant="outline" className="rounded-xl px-8 font-semibold">
                            Contact Us
                        </Button>
                    </Link>
                </div>
            </section>

            <div className="h-8" />
        </div>
    );
}
