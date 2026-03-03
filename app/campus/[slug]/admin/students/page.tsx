import { getStudentEnrollments, getStudentClasses, getClasses } from "../academic-actions";
import StudentsClient from "./students-client";

export default async function StudentsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let students, studentClasses, classes;
    try {
        [students, studentClasses, classes] = await Promise.all([
            getStudentEnrollments(slug), getStudentClasses(slug), getClasses(slug),
        ]);
    } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }
    return <StudentsClient students={students} studentClasses={studentClasses} classes={classes} slug={slug} />;
}
