import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Removed global initialization

export async function GET(request: Request) {
    try {
        // Initialize within the request handler
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        );

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query) {
            return NextResponse.json({ institutions: [] });
        }

        // Limit search results to 10 for performance
        const { data: institutions, error } = await supabase
            .from("institutions")
            .select("id, name, slug, logo_url")
            .ilike("name", `%${query}%`)
            .limit(10);

        if (error) {
            console.error("Institution search error:", error);
            return NextResponse.json({ error: "Failed to search institutions" }, { status: 500 });
        }

        return NextResponse.json({ institutions });
    } catch (error) {
        console.error("Institution search extraction error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
