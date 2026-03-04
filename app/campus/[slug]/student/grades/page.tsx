import { getMyMarks } from "../student-actions";
import StudentMarksClient from "../marks/marks-client";

export const metadata = { title: "My Grades" };

export default async function StudentGradesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let marks;
    try { marks = await getMyMarks(slug); } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }

    // We reuse the marks client directly for the "grades" view to prevent duplication, 
    // as it already looks great and serves the exact purpose.
    return <StudentMarksClient marks={marks as any} />;
}
