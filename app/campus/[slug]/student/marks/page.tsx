import { getMyMarks } from "../student-actions";
import StudentMarksClient from "./marks-client";

export default async function StudentMarksPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let marks;
    try { marks = await getMyMarks(slug); } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }
    return <StudentMarksClient marks={marks as any} />;
}
