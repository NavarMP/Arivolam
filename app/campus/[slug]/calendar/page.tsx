"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const EVENTS = [
    { id: 1, title: "Software Engineering Lecture", type: "class", time: "09:30 AM", room: "Hall A", date: "2023-10-25" },
    { id: 2, title: "Web Programming Lab", type: "lab", time: "10:30 AM", room: "Lab 2", date: "2023-10-25" },
    { id: 3, title: "Project Discussion", type: "meeting", time: "02:00 PM", room: "Conf Room", date: "2023-10-26" },
    { id: 4, title: "Internal Exam", type: "exam", time: "10:00 AM", room: "Exam Hall", date: "2023-10-27" },
];

export default function CampusCalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
                    <p className="text-muted-foreground">Schedule and Events</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="min-w-[120px] text-center font-medium">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Monthly View</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground">
                            {DAYS.map(day => <div key={day} className="py-2">{day}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                                return (
                                    <div key={day} className={cn(
                                        "relative flex aspect-square flex-col items-center justify-center rounded-lg border bg-card/50 p-2 transition-colors hover:bg-muted/50",
                                        isToday && "border-primary bg-primary/5 font-bold text-primary"
                                    )}>
                                        <span>{day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {EVENTS.map(event => (
                                <div key={event.id} className="flex items-start gap-4 rounded-lg border p-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <div className="text-center text-xs font-bold leading-none">
                                            <div className="text-[10px] uppercase">OCT</div>
                                            <div className="text-sm">25</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{event.title}</h4>
                                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {event.time}</span>
                                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.room}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
