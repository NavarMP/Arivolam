"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, MapPin, Briefcase } from "lucide-react";

export function FacultyWelcomeBanner({
    faculty,
    institutionName,
}: {
    faculty: any;
    institutionName: string;
}) {
    const hour = new Date().getHours();
    let greeting = "Good evening";
    if (hour < 12) greeting = "Good morning";
    else if (hour < 17) greeting = "Good afternoon";

    const displayName = faculty.user_metadata?.full_name || faculty.email?.split("@")[0] || "Faculty";
    const department = faculty.department || "General Administration";
    const roleLabel = faculty.role === 'admin' ? 'Administrator' : 'Faculty Member';

    return (
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md">
            <CardContent className="p-0">
                <div className="relative p-6 sm:p-8 md:p-10">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4 max-w-2xl">
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-md">
                                <Sparkles className="h-4 w-4 text-emerald-100" />
                                <span className="text-white">Faculty Portal</span>
                            </div>

                            <div>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2">
                                    {greeting}, {displayName.split(' ')[0]}
                                </h1>
                                <p className="text-emerald-100 text-lg flex items-center gap-2">
                                    <MapPin className="h-4 w-4 opacity-70" />
                                    {institutionName}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 shrink-0 bg-black/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                    <Briefcase className="h-5 w-5 text-white" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-medium text-white/70 uppercase tracking-widest">Department</p>
                                    <p className="font-semibold text-white">{department}</p>
                                </div>
                            </div>
                            <div className="h-px bg-white/10 w-full" />
                            <div className="flex items-center justify-between gap-8">
                                <p className="text-xs font-medium text-white/70">ROLE</p>
                                <p className="font-medium text-emerald-100">{roleLabel}</p>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-20 pointer-events-none mix-blend-overlay">
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-[400px] h-[400px] fill-white animate-spin-slow" style={{ animationDuration: '40s' }}>
                            <path d="M42.7,-73.4C55.9,-67.2,67.8,-56.3,77.1,-43.3C86.4,-30.3,93.1,-15.1,91.8,-0.7C90.5,13.7,81.2,27.3,71.7,40.1C62.2,52.9,52.5,64.9,40.1,72.4C27.7,79.9,13.8,82.9,-0.6,83.9C-15.1,84.9,-30.2,83.9,-42.9,76.6C-55.6,69.3,-65.9,55.7,-73.5,41.2C-81.1,26.7,-86,11.3,-84.9,-3.6C-83.8,-18.5,-76.7,-32.9,-67.2,-44.6C-57.7,-56.3,-45.8,-65.3,-33.1,-71.4C-20.4,-77.5,-10.2,-80.7,2.1,-84.1C14.4,-87.5,28.8,-91.1,42.7,-73.4Z" transform="translate(100 100)" />
                        </svg>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
