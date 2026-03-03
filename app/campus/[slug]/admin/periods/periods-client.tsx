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
import { Plus, Pencil, Trash2, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { createPeriod, updatePeriod, deletePeriod } from "../academic-actions";

type Period = {
    id: string; name: string; start_time: string; end_time: string;
    sort_order: number; is_break: boolean; is_active: boolean; created_at: string;
};

export default function PeriodsClient({ initialPeriods, slug }: { initialPeriods: Period[]; slug: string }) {
    const [periods, setPeriods] = useState(initialPeriods);
    const [isPending, startTransition] = useTransition();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<Period | null>(null);
    const [name, setName] = useState("");
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("09:50");
    const [sortOrder, setSortOrder] = useState("1");
    const [isBreak, setIsBreak] = useState(false);

    const resetForm = () => { setName(""); setStartTime("09:00"); setEndTime("09:50"); setSortOrder(String((periods.length || 0) + 1)); setIsBreak(false); setEditItem(null); };
    const openCreate = () => { resetForm(); setDialogOpen(true); };
    const openEdit = (p: Period) => {
        setEditItem(p); setName(p.name); setStartTime(p.start_time); setEndTime(p.end_time);
        setSortOrder(p.sort_order.toString()); setIsBreak(p.is_break); setDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!name.trim() || !startTime || !endTime) { toast.error("Name, start time, and end time are required."); return; }
        startTransition(async () => {
            const formData = { name: name.trim(), start_time: startTime, end_time: endTime, sort_order: parseInt(sortOrder) || 1, is_break: isBreak };
            const result = editItem
                ? await updatePeriod(slug, editItem.id, formData)
                : await createPeriod(slug, formData);
            if (result.error) { toast.error(result.error); } else {
                toast.success(editItem ? "Period updated!" : "Period created!");
                setDialogOpen(false); resetForm(); window.location.reload();
            }
        });
    };

    const handleDelete = (id: string, pName: string) => {
        if (!confirm(`Delete period "${pName}"?`)) return;
        startTransition(async () => {
            const result = await deletePeriod(slug, id);
            if (result.error) { toast.error(result.error); } else {
                toast.success("Period deleted."); setPeriods(prev => prev.filter(p => p.id !== id));
            }
        });
    };

    const formatTime = (t: string) => {
        const [h, m] = t.split(":");
        const hour = parseInt(h);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${m} ${ampm}`;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Clock className="h-8 w-8 text-amber-500" /> Periods / Hours
                    </h1>
                    <p className="text-muted-foreground mt-1">Define daily time slots for the timetable.</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) resetForm(); }}>
                    <DialogTrigger asChild><Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Period</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>{editItem ? "Edit Period" : "Create Period"}</DialogTitle></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2"><Label>Period Name *</Label><Input placeholder="e.g., Period 1" value={name} onChange={e => setName(e.target.value)} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Start Time *</Label><Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} /></div>
                                <div className="grid gap-2"><Label>End Time *</Label><Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} /></div>
                            </div>
                            <div className="grid gap-2"><Label>Sort Order</Label><Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} /></div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="is-break" checked={isBreak} onCheckedChange={(v) => setIsBreak(!!v)} />
                                <Label htmlFor="is-break" className="text-sm">This is a break (lunch, tea, etc.)</Label>
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

            {periods.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold">No periods defined</h3>
                        <p className="text-sm text-muted-foreground mt-1">Define your daily time slots to build timetables.</p>
                        <Button className="mt-4 gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Add Period</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {periods.map((p, i) => (
                        <Card key={p.id} className={`group hover:shadow-md transition-all ${p.is_break ? "border-dashed bg-muted/30" : ""}`}>
                            <CardContent className="flex items-center justify-between py-4 px-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                                        {p.sort_order}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold flex items-center gap-2">
                                            {p.name}
                                            {p.is_break && <Badge variant="secondary" className="text-xs">Break</Badge>}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {formatTime(p.start_time)} — {formatTime(p.end_time)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id, p.name)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
