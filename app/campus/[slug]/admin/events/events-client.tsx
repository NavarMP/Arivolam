"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, CalendarRange, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from "../academic-actions";

type CalendarEvent = {
    id: string; title: string; description: string | null; event_type: string;
    start_date: string; end_date: string | null; all_day: boolean;
    location: string | null; color: string | null; is_active: boolean;
    department: { id: string; name: string; code: string } | null;
};
type Dept = { id: string; name: string; code: string };

const EVENT_TYPES = [
    { value: "general", label: "General", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
    { value: "exam", label: "Exam", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    { value: "holiday", label: "Holiday", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    { value: "meeting", label: "Meeting", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    { value: "seminar", label: "Seminar", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
    { value: "workshop", label: "Workshop", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
    { value: "sports", label: "Sports", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
    { value: "cultural", label: "Cultural", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400" },
    { value: "other", label: "Other", color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300" },
];

export default function EventsClient({ initialEvents, departments, slug }: {
    initialEvents: CalendarEvent[]; departments: Dept[]; slug: string;
}) {
    const [events, setEvents] = useState(initialEvents);
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<CalendarEvent | null>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [eventType, setEventType] = useState("general");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [allDay, setAllDay] = useState(false);
    const [location, setLocation] = useState("");
    const [color, setColor] = useState("");
    const [deptId, setDeptId] = useState("");

    const resetForm = () => {
        setTitle(""); setDescription(""); setEventType("general"); setStartDate(""); setEndDate("");
        setAllDay(false); setLocation(""); setColor(""); setDeptId(""); setEditItem(null);
    };
    const openCreate = () => { resetForm(); setDialogOpen(true); };
    const openEdit = (ev: CalendarEvent) => {
        setEditItem(ev); setTitle(ev.title); setDescription(ev.description || "");
        setEventType(ev.event_type); setStartDate(ev.start_date ? ev.start_date.slice(0, 16) : "");
        setEndDate(ev.end_date ? ev.end_date.slice(0, 16) : ""); setAllDay(ev.all_day);
        setLocation(ev.location || ""); setColor(ev.color || "");
        setDeptId(ev.department?.id || ""); setDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!title.trim() || !startDate) { toast.error("Title and start date are required."); return; }
        startTransition(async () => {
            const formData = {
                title: title.trim(), description: description.trim() || undefined,
                event_type: eventType, start_date: startDate, end_date: endDate || undefined,
                all_day: allDay, location: location.trim() || undefined,
                color: color || undefined, department_id: deptId || undefined
            };
            const result = editItem
                ? await updateCalendarEvent(slug, editItem.id, formData)
                : await createCalendarEvent(slug, formData);
            if (result.error) { toast.error(result.error); } else {
                toast.success(editItem ? "Event updated!" : "Event created!");
                setDialogOpen(false); resetForm(); window.location.reload();
            }
        });
    };

    const handleDelete = (id: string, evTitle: string) => {
        if (!confirm(`Delete event "${evTitle}"?`)) return;
        startTransition(async () => {
            const result = await deleteCalendarEvent(slug, id);
            if (result.error) { toast.error(result.error); } else {
                toast.success("Event deleted."); setEvents(prev => prev.filter(e => e.id !== id));
            }
        });
    };

    const getTypeInfo = (type: string) => EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1];

    const formatDate = (d: string) => {
        try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
        catch { return d; }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <CalendarRange className="h-8 w-8 text-rose-500" /> Events
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage calendar events for the institution.</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) resetForm(); }}>
                    <DialogTrigger asChild><Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Event</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader><DialogTitle>{editItem ? "Edit Event" : "Create Event"}</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="grid gap-2"><Label>Title *</Label><Input placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} /></div>
                            <div className="grid gap-2"><Label>Description</Label><Input placeholder="Brief description..." value={description} onChange={e => setDescription(e.target.value)} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={eventType} onChange={e => setEventType(e.target.value)}>
                                        {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Scope</Label>
                                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={deptId} onChange={e => setDeptId(e.target.value)}>
                                        <option value="">Institution-wide</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Start Date/Time *</Label><Input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                                <div className="grid gap-2"><Label>End Date/Time</Label><Input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="all-day" checked={allDay} onCheckedChange={v => setAllDay(!!v)} />
                                <Label htmlFor="all-day" className="text-sm">All-day event</Label>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Location</Label><Input placeholder="e.g., Main Hall" value={location} onChange={e => setLocation(e.target.value)} /></div>
                                <div className="grid gap-2"><Label>Color</Label><Input type="color" value={color || "#6366f1"} onChange={e => setColor(e.target.value)} className="h-10" /></div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handleSubmit} disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editItem ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {events.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <CalendarRange className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold">No events yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">Create events to populate the campus calendar.</p>
                        <Button className="mt-4 gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Add Event</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {events.map(ev => {
                        const typeInfo = getTypeInfo(ev.event_type);
                        return (
                            <Card key={ev.id} className="group hover:shadow-md transition-all">
                                <CardContent className="flex items-center justify-between py-4 px-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: (ev.color || "#6366f1") + "20", color: ev.color || "#6366f1" }}>
                                            <CalendarRange className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold flex items-center gap-2">
                                                {ev.title}
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${typeInfo.color}`}>{typeInfo.label}</span>
                                                {ev.department && <Badge variant="outline" className="text-[10px]">{ev.department.code}</Badge>}
                                                {!ev.department && <Badge variant="secondary" className="text-[10px]">All</Badge>}
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(ev.start_date)}</span>
                                                {ev.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {ev.location}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(ev)}><Pencil className="h-3.5 w-3.5" /></Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(ev.id, ev.title)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
