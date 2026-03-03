import { getSubjects, getDepartments, getSemesters, getFacultyEnrollments, getClasses, getFacultySubjects } from "../academic-actions";
import SubjectsClient from "./subjects-client";

export default async function SubjectsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let subjects, departments, semesters, faculties, classes, facultySubjects;
    try {
        [subjects, departments, semesters, faculties, classes, facultySubjects] = await Promise.all([
            getSubjects(slug), getDepartments(slug), getSemesters(slug),
            getFacultyEnrollments(slug), getClasses(slug), getFacultySubjects(slug),
        ]);
    } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }
    return <SubjectsClient initialSubjects={subjects} departments={departments} semesters={semesters}
        faculties={faculties} classes={classes} facultySubjects={facultySubjects} slug={slug} />;
}
