import { getCourses } from "./actions";
import { getDepartments, getSubjects, getSemesters } from "../academic-actions";
import CoursesClient from "./courses-client";

export default async function CoursesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let courses, departments, subjects, semesters;
    try {
        [courses, departments, subjects, semesters] = await Promise.all([
            getCourses(slug),
            getDepartments(slug),
            getSubjects(slug),
            getSemesters(slug),
        ]);
    } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }
    return <CoursesClient courses={courses} departments={departments} subjects={subjects} semesters={semesters} slug={slug} />;
}
