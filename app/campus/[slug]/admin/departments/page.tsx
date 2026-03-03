import { getDepartments, getFacultyEnrollments } from "../academic-actions";
import DepartmentsClient from "./departments-client";

export default async function DepartmentsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;

    let departments, faculties;
    try {
        [departments, faculties] = await Promise.all([
            getDepartments(slug),
            getFacultyEnrollments(slug),
        ]);
    } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }

    return <DepartmentsClient initialDepartments={departments} faculties={faculties} slug={slug} />;
}
