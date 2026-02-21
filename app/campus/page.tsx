"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Building2,
    GraduationCap,
    Map,
    Fingerprint,
    Calendar,
    BarChart3,
    ShieldCheck,
    Zap,
    ArrowRight,
} from "lucide-react";
import { AdaptiveLogo } from "@/components/shared/adaptive-logo";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
    {
        icon: <Fingerprint className="h-8 w-8 text-primary" />,
        title: "RFID Attendance Monitoring",
        description: "Automated, contact-less attendance tracking with instant updates directly to the ERP dashboard.",
    },
    {
        icon: <Map className="h-8 w-8 text-blue-500" />,
        title: "Intelligent Navigation",
        description: "Futuristic campus map and turn-by-turn navigation so students and visitors never get lost.",
    },
    {
        icon: <BarChart3 className="h-8 w-8 text-green-500" />,
        title: "Advanced Grading Analytics",
        description: "Comprehensive performance tracking with AI-driven insights for students and faculty.",
    },
    {
        icon: <Calendar className="h-8 w-8 text-purple-500" />,
        title: "Unified Events Hub",
        description: "Centralized scheduling for exams, seminars, and cultural events with push notifications.",
    },
    {
        icon: <ShieldCheck className="h-8 w-8 text-red-500" />,
        title: "Secure Access Control",
        description: "Role-based access management ensuring pristine security across all campus domains.",
    },
    {
        icon: <Zap className="h-8 w-8 text-yellow-500" />,
        title: "Lightning Fast ERP",
        description: "Optimized performance handling thousands of concurrent users with zero latency.",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
};

export default function CampusLandingPage() {
    return (
        <div className="relative min-h-screen bg-background overflow-hidden text-foreground">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
                {/* Navigation / Header */}
                <div className="absolute top-6 left-6 right-6 md:left-8 md:right-8 z-20 flex justify-between items-center">
                    {/* <Link href="/">
                        <Button variant="ghost" className="gap-2 bg-background/50 backdrop-blur-sm">
                            <ArrowRight className="h-4 w-4 rotate-180" />
                            Return to Social
                        </Button>
                    </Link> */}
                    <ThemeToggle />
                </div>

                {/* Hero Section */}
                <div className="text-center pt-16">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex justify-center mb-6">
                            <AdaptiveLogo size={120} />
                        </div>
                        <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                            Arivolam Ecosystem
                        </span>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
                            Campus <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">ERP</span>
                        </h1>
                        <p className="mt-4 max-w-2xl text-xl text-muted-foreground mx-auto mb-10">
                            The ultimate infrastructure for educational excellence. Built on top of the Arivolam Social network, experience futuristic tech like RFID tracking and intelligent navigation seamlessly integrated into one powerful platform.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                            <Link href="/campus/login">
                                <Button size="lg" className="w-full sm:w-auto gap-2 group text-base h-12 px-8 shadow-lg shadow-primary/25">
                                    <Building2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                    Universal Campus Login
                                </Button>
                            </Link>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <Link href="/campus/create">
                                <Button variant="link" className="text-muted-foreground hover:text-primary">
                                    Register your Institution
                                </Button>
                            </Link>
                        </div>

                        {/* Social Bridge Card */}
                        <div className="mt-16 max-w-3xl mx-auto p-1 rounded-3xl bg-gradient-to-br from-primary/20 via-border/50 to-transparent">
                            <div className="flex flex-col sm:flex-row items-center gap-6 p-8 rounded-[22px] bg-card/80 backdrop-blur-xl border border-border/50 text-left">
                                <div className="h-16 w-16 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <AdaptiveLogo size={40} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-foreground">Arivolam Social</h3>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        The ERP is just one half of the experience. Connect with peers, share knowledge, and explore other institutions on the main social platform.
                                    </p>
                                </div>
                                <Link href="/">
                                    <Button variant="outline" className="shrink-0 gap-2 rounded-xl">
                                        Open App
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Features Section */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="mt-32"
                >
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Unmatched Futuristic Capabilities</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            We've re-imagined campus management from the ground up to give you an unparalleled experience.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                className="relative group p-6 rounded-3xl bg-card border border-border/50 hover:border-primary/50 transition-colors"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                                <div className="relative z-10">
                                    <div className="mb-4 bg-background w-16 h-16 rounded-2xl flex items-center justify-center border border-border/50 shadow-sm">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
