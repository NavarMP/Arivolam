import { getMyAttendance } from "../student-actions";
import StudentAttendanceClient from "./attendance-client";

export default async function StudentAttendancePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let attendance;
    try { attendance = await getMyAttendance(slug); } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }
    return <StudentAttendanceClient attendance={attendance as any} />;
}
