import { createClient } from "@/utils/supabase/server";

export default async function DebugAuthPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let profile = null;
    let memberships = null;
    let enrollments = null;
    let institutions = null;

    if (user) {
        const p = await supabase.from("arivolam_profiles").select("*").eq("id", user.id);
        profile = p.data;

        const m = await supabase.from("institution_members").select("*, institutions(name, slug)").eq("user_id", user.id);
        memberships = m.data;

        const e = await supabase.from("enrollments").select("*").eq("email", user.email);
        enrollments = e.data;
    }

    const { data: allInsts } = await supabase.from("institutions").select("id, name, slug");
    institutions = allInsts;

    return (
        <div className="p-8 font-mono text-sm max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold border-b pb-2">Auth Debugger 🕵️‍♂️</h1>

            <section>
                <h2 className="text-lg font-bold text-blue-500 mb-2">1. Auth User</h2>
                {user ? (
                    <pre className="bg-muted p-4 rounded overflow-auto">
                        {JSON.stringify(user, null, 2)}
                    </pre>
                ) : (
                    <div className="p-4 bg-red-100 text-red-800 rounded">
                        No User Logged In
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-lg font-bold text-green-500 mb-2">2. Profile (arivolam_profiles)</h2>
                <pre className="bg-muted p-4 rounded overflow-auto">
                    {JSON.stringify(profile, null, 2)}
                </pre>
            </section>

            <section>
                <h2 className="text-lg font-bold text-purple-500 mb-2">3. Memberships (institution_members)</h2>
                <pre className="bg-muted p-4 rounded overflow-auto">
                    {JSON.stringify(memberships, null, 2)}
                </pre>
            </section>

            <section>
                <h2 className="text-lg font-bold text-orange-500 mb-2">4. Enrollments (matched by email)</h2>
                <pre className="bg-muted p-4 rounded overflow-auto">
                    {JSON.stringify(enrollments, null, 2)}
                </pre>
            </section>

            <section>
                <h2 className="text-lg font-bold text-gray-500 mb-2">5. All Institutions</h2>
                <pre className="bg-muted p-4 rounded overflow-auto">
                    {JSON.stringify(institutions, null, 2)}
                </pre>
            </section>
        </div>
    );
}
