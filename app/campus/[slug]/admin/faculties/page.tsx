import { getFaculties, getPendingFacultyRequests } from "./actions";
import { getDepartments } from "../academic-actions";
import FacultiesClient from "./faculties-client";

export default async function FacultiesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let faculties, pendingRequests, departments;
    try {
        [faculties, pendingRequests, departments] = await Promise.all([
            getFaculties(slug),
            getPendingFacultyRequests(slug),
            getDepartments(slug),
        ]);
    } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }
    return (
        <FacultiesClient
            faculties={faculties}
            pendingRequests={pendingRequests}
            departments={departments}
            slug={slug}
        />
    );
}
