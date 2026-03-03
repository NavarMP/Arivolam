import { getSemesters } from "../academic-actions";
import SemestersClient from "./semesters-client";

export default async function SemestersPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let semesters;
    try { semesters = await getSemesters(slug); } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }
    return <SemestersClient initialSemesters={semesters} slug={slug} />;
}
