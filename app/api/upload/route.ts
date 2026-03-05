import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const client = await createClient();
        const { data: { user }, error: authError } = await client.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const bucket = formData.get("bucket") as string | null;
        const fileName = formData.get("fileName") as string | null;

        if (!file || !bucket || !fileName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Use service role key since our remote bucket doesn't have RLS policies set up yet
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        const supabase = createServiceClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                contentType: file.type,
                upsert: true,
            });

        if (error) {
            console.error("Supabase Storage Upload Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return NextResponse.json({ url: publicUrlData.publicUrl });
    } catch (error: any) {
        console.error("Upload handler error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
