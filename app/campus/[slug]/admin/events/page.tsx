import { getCalendarEvents, getDepartments } from "../academic-actions";
import EventsClient from "./events-client";

export default async function EventsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let events, departments;
    try {
        [events, departments] = await Promise.all([
            getCalendarEvents(slug), getDepartments(slug),
        ]);
    } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }
    return <EventsClient initialEvents={events} departments={departments} slug={slug} />;
}
