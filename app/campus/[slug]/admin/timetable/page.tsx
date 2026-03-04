import { getClasses, getPeriods } from "../academic-actions";
import TimetableClient from "./timetable-client";

export const metadata = { title: "Timetable Management" };

export default async function AdminTimetablePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Fetch required base data
    const [classes, periods] = await Promise.all([
        getClasses(slug),
        getPeriods(slug),
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Timetable Management</h2>
                <p className="text-muted-foreground">Manage weekly schedules for all classes.</p>
            </div>

            <TimetableClient
                classes={classes as any}
                periods={periods as any}
                slug={slug}
            />
        </div>
    );
}
