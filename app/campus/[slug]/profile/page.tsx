"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, GraduationCap, Grid } from "lucide-react";

export default function CampusProfilePage() {
    return (
        <div className="space-y-6">
            <div className="relative h-48 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="absolute -bottom-16 left-8 flex items-end">
                    <div className="h-32 w-32 rounded-full border-4 border-background bg-zinc-200">
                        {/* Avatar Placeholder */}
                    </div>
                </div>
            </div>

            <div className="mt-20 px-8">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Muhammed Navar</h1>
                        <p className="text-muted-foreground">BCA 3rd Year • Semester 6</p>
                    </div>
                    <Button>Edit Profile</Button>
                </div>
            </div>

            <div className="grid gap-6 px-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Personal Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between border-b py-2 text-sm last:border-0">
                            <span className="text-muted-foreground">Admission No</span>
                            <span className="font-medium">2023BCA045</span>
                        </div>
                        <div className="flex justify-between border-b py-2 text-sm last:border-0">
                            <span className="text-muted-foreground">DOB</span>
                            <span className="font-medium">10 Jan 2003</span>
                        </div>
                        <div className="flex justify-between border-b py-2 text-sm last:border-0">
                            <span className="text-muted-foreground">Gender</span>
                            <span className="font-medium">Male</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Academic Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between border-b py-2 text-sm last:border-0">
                            <span className="text-muted-foreground">Department</span>
                            <span className="font-medium">Computer Application</span>
                        </div>
                        <div className="flex justify-between border-b py-2 text-sm last:border-0">
                            <span className="text-muted-foreground">Batch</span>
                            <span className="font-medium">2023 - 2026</span>
                        </div>
                        <div className="flex justify-between border-b py-2 text-sm last:border-0">
                            <span className="text-muted-foreground">Current CGPA</span>
                            <span className="font-medium">8.5</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" /> Contact Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-3 border-b py-2 text-sm last:border-0">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">navar@example.com</span>
                        </div>
                        <div className="flex items-center gap-3 border-b py-2 text-sm last:border-0">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">+91 98765 43210</span>
                        </div>
                        <div className="flex items-center gap-3 border-b py-2 text-sm last:border-0">
                            <Grid className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">SAFI Institute, Vazhayur</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
