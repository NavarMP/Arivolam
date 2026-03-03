import { getClasses, getDepartments, getSemesters } from "../academic-actions";
import ClassesClient from "./classes-client";

export default async function ClassesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let classes, departments, semesters;
    try {
        [classes, departments, semesters] = await Promise.all([
            getClasses(slug), getDepartments(slug), getSemesters(slug),
        ]);
    } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }
    return <ClassesClient initialClasses={classes} departments={departments} semesters={semesters} slug={slug} />;
}
