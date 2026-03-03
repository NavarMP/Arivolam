import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, Clock, MapPin } from "lucide-react";

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
    general: { label: "General", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
    exam: { label: "Exam", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    holiday: { label: "Holiday", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    meeting: { label: "Meeting", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    seminar: { label: "Seminar", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
    workshop: { label: "Workshop", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
    sports: { label: "Sports", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
    cultural: { label: "Cultural", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400" },
    other: { label: "Other", color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300" },
};

export default async function CalendarPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: institution } = await supabase
        .from("institutions")
        .select("id, name")
        .eq("slug", slug)
        .single();

    if (!institution) return <div className="p-8 text-center">Institution not found</div>;

    const sc = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const { data: events } = await sc
        .from("calendar_events")
        .select("*, department:departments(id, name, code)")
        .eq("institution_id", institution.id)
        .eq("is_active", true)
        .order("start_date", { ascending: true });

    const now = new Date().toISOString();
    const upcoming = (events || []).filter((e: any) => e.start_date >= now);
    const past = (events || []).filter((e: any) => e.start_date < now);

    const formatDate = (d: string) => {
        try {
            return new Date(d).toLocaleDateString("en-US", {
                weekday: "short", month: "short", day: "numeric", year: "numeric",
                hour: "2-digit", minute: "2-digit",
            });
        } catch { return d; }
    };

    const renderEventList = (eventList: any[], emptyMessage: string) => {
        if (eventList.length === 0) {
            return (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <CalendarRange className="h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                    </CardContent>
                </Card>
            );
        }
        return (
            <div className="space-y-3">
                {eventList.map((ev: any) => {
                    const typeConfig = EVENT_TYPE_CONFIG[ev.event_type] || EVENT_TYPE_CONFIG.other;
                    return (
                        <Card key={ev.id} className="hover:shadow-md transition-all">
                            <CardContent className="flex items-start gap-4 py-4 px-5">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                                    style={{ backgroundColor: (ev.color || "#6366f1") + "18", color: ev.color || "#6366f1" }}>
                                    <CalendarRange className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        {ev.title}
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${typeConfig.color}`}>{typeConfig.label}</span>
                                    </h3>
                                    {ev.description && <p className="text-sm text-muted-foreground mt-1">{ev.description}</p>}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(ev.start_date)}</span>
                                        {ev.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {ev.location}</span>}
                                        {ev.department ? (
                                            <Badge variant="outline" className="text-[10px]">{ev.department.code}</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-[10px]">Institution</Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <CalendarRange className="h-8 w-8 text-rose-500" /> Campus Calendar
                </h1>
                <p className="text-muted-foreground mt-1">{institution.name} — Events, Exams, Holidays & More</p>
            </div>

            <div className="space-y-6">
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        Upcoming Events
                        <Badge variant="secondary">{upcoming.length}</Badge>
                    </h2>
                    {renderEventList(upcoming, "No upcoming events")}
                </div>

                {past.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            Past Events
                            <Badge variant="outline">{past.length}</Badge>
                        </h2>
                        {renderEventList(past.slice(0, 20), "No past events")}
                    </div>
                )}
            </div>
        </div>
    );
}
