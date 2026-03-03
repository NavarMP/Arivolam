import { getMyClasses, getMyTimetableEntries } from "../faculty-actions";
import AttendanceClient from "./attendance-client";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export default async function AttendancePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const supabase = await createClient();

    // Get institution for periods
    const { data: institution } = await supabase
        .from("institutions")
        .select("id")
        .eq("slug", slug)
        .single();

    let assignments, timetableEntries, periods: any[] = [];
    try {
        [assignments, timetableEntries] = await Promise.all([
            getMyClasses(slug),
            getMyTimetableEntries(slug),
        ]);

        if (institution) {
            const sc = createServiceClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL || "",
                process.env.SUPABASE_SERVICE_ROLE_KEY || ""
            );
            const { data } = await sc
                .from("periods")
                .select("id, name, start_time, end_time, sort_order")
                .eq("institution_id", institution.id)
                .eq("is_active", true)
                .order("sort_order");
            periods = data || [];
        }
    } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }

    return <AttendanceClient assignments={assignments as any} timetableEntries={timetableEntries as any} periods={periods} slug={slug} />;
}
