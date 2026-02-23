"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, MapPin, Users } from "lucide-react";

export function ParentWelcomeBanner({
    parent,
    institutionName,
}: {
    parent: any;
    institutionName: string;
}) {
    const hour = new Date().getHours();
    let greeting = "Good evening";
    if (hour < 12) greeting = "Good morning";
    else if (hour < 17) greeting = "Good afternoon";

    const displayName = parent.user_metadata?.full_name || parent.email?.split("@")[0] || "Guardian";
    const studentLinked = parent.department || "No specific student linked"; // Currently using department column for simplicity if needed, or we can just say "Ward linked"

    return (
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white shadow-md">
            <CardContent className="p-0">
                <div className="relative p-6 sm:p-8 md:p-10">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4 max-w-2xl">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-md">
                                <Sparkles className="h-4 w-4 text-orange-100" />
                                <span className="text-white">Parent Portal</span>
                            </div>

                            <div>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2">
                                    {greeting}, {displayName.split(' ')[0]}
                                </h1>
                                <p className="text-orange-100 text-lg flex items-center gap-2">
                                    <MapPin className="h-4 w-4 opacity-70" />
                                    {institutionName}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 shrink-0 bg-black/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                            <div className="flex items-center justify-between gap-8">
                                <p className="text-xs font-medium text-white/70">ROLE</p>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-orange-200" />
                                    <p className="font-medium text-orange-100">Parent / Guardian</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-20 pointer-events-none mix-blend-overlay">
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-[400px] h-[400px] fill-white animate-spin-slow" style={{ animationDuration: '40s' }}>
                            <path d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.6,-46.3C91.4,-33.5,98,-18,97.7,-2.6C97.4,12.8,90.2,28.1,80.7,41.2C71.2,54.3,59.4,65.2,45.8,72.7C32.2,80.2,16.1,84.3,0.7,83.1C-14.7,81.9,-29.4,75.4,-42.6,67.3C-55.8,59.2,-67.5,49.5,-75.6,37.3C-83.7,25.1,-88.2,10.4,-88.8,-4.5C-89.4,-19.4,-86.1,-34.5,-77.8,-47C-69.5,-59.5,-56.2,-69.4,-42.1,-76.6C-28,-83.8,-14,-88.3,0.8,-89.6C15.6,-91,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
                        </svg>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
