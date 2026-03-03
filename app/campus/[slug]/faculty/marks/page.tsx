import { getMyClasses, getMyExams } from "../faculty-actions";
import MarksClient from "./marks-client";

export default async function MarksPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let assignments, exams;
    try {
        [assignments, exams] = await Promise.all([getMyClasses(slug), getMyExams(slug)]);
    } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }
    return <MarksClient assignments={assignments as any} exams={exams as any} slug={slug} />;
}
