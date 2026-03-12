import { getStudents, getPendingStudents } from "./actions";
import { getClasses, getDepartments } from "../academic-actions";
import StudentsClient from "./students-client";

export default async function StudentsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let students, pendingStudents, classes, departments;
    try {
        [students, pendingStudents, classes, departments] = await Promise.all([
            getStudents(slug),
            getPendingStudents(slug),
            getClasses(slug),
            getDepartments(slug),
        ]);
    } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }
    return (
        <StudentsClient
            students={students}
            pendingStudents={pendingStudents}
            classes={classes}
            departments={departments}
            slug={slug}
        />
    );
}
