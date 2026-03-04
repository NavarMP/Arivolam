import { getMyTimetable, getMyClassInfo } from "../student-actions";
import TimetableClient from "./timetable-client";

export const metadata = { title: "My Timetable" };

export default async function StudentTimetablePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const [timetable, classInfo] = await Promise.all([
        getMyTimetable(slug),
        getMyClassInfo(slug)
    ]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">My Timetable</h2>
                <p className="text-muted-foreground">
                    Your weekly class schedule for {classInfo?.class ? (classInfo.class as any).name : "your assigned class"}.
                </p>
            </div>

            <TimetableClient
                entries={timetable as any}
            />
        </div>
    );
}

