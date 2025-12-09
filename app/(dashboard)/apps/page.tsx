"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, Bus, Coffee, Dumbbell, Globe, Library, Monitor, Music, Printer } from "lucide-react";
import Link from "next/link";

const APPS = [
    { name: "Library", icon: Library, color: "text-orange-500", bg: "bg-orange-500/10", desc: "Book search & renewals" },
    { name: "Transport", icon: Bus, color: "text-yellow-500", bg: "bg-yellow-500/10", desc: "Bus routes & timings" },
    { name: "Labs", icon: Monitor, color: "text-blue-500", bg: "bg-blue-500/10", desc: "Lab availability status" },
    { name: "Canteen", icon: Coffee, color: "text-amber-700", bg: "bg-amber-700/10", desc: "Menu & ordering" },
    { name: "Sports", icon: Dumbbell, color: "text-red-500", bg: "bg-red-500/10", desc: "Ground booking" },
    { name: "Printing", icon: Printer, color: "text-zinc-500", bg: "bg-zinc-500/10", desc: "Remote print requests" },
    { name: "Events", icon: Music, color: "text-purple-500", bg: "bg-purple-500/10", desc: "Campus activities" },
    { name: "E-Resources", icon: Globe, color: "text-cyan-500", bg: "bg-cyan-500/10", desc: "Digital journals" },
];

export default function AppsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
                <p className="text-muted-foreground">Access all campus services in one place.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {APPS.map((app) => (
                    <Link key={app.name} href="#" className="block group">
                        <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${app.bg} transition-transform group-hover:scale-110`}>
                                    <app.icon className={`h-8 w-8 ${app.color}`} />
                                </div>
                                <h3 className="font-semibold">{app.name}</h3>
                                <p className="mt-1 text-xs text-muted-foreground">{app.desc}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
