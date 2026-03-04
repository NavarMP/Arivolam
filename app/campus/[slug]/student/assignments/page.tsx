import { getMyAssignmentsWithSubmissions } from "../student-actions";
import AssignmentsClient from "./assignments-client";

export const metadata = { title: "My Assignments" };

export default async function StudentAssignmentsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    let assignments = [];
    try {
        assignments = await getMyAssignmentsWithSubmissions(slug);
    } catch (e) {
        // Handle gracefully
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">My Assignments</h2>
                <p className="text-muted-foreground">
                    View upcoming deadlines and submit your work.
                </p>
            </div>

            <AssignmentsClient assignments={assignments as any} slug={slug} />
        </div>
    );
}
