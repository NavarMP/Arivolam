import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.SUPABASE_SERVICE_ROLE_KEY || ""
        );

        const { searchParams } = new URL(request.url);
        const slug = searchParams.get("slug");

        if (!slug) {
            return NextResponse.json({ available: false, error: "Slug is required" });
        }

        // Normalize slug
        const normalized = slug
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");

        if (normalized.length < 3) {
            return NextResponse.json({ available: false, error: "Slug must be at least 3 characters" });
        }

        // Reserved slugs
        const reserved = ["login", "signup", "create", "admin", "api", "settings", "dashboard"];
        if (reserved.includes(normalized)) {
            return NextResponse.json({ available: false, error: "This slug is reserved" });
        }

        const { data, error } = await supabase
            .from("institutions")
            .select("id")
            .eq("slug", normalized)
            .maybeSingle();

        if (error) {
            console.error("Slug validation error:", error);
            return NextResponse.json({ available: false, error: "Validation failed" }, { status: 500 });
        }

        return NextResponse.json({
            available: !data,
            normalized,
        });
    } catch (error) {
        console.error("Slug validation error:", error);
        return NextResponse.json({ available: false, error: "Internal server error" }, { status: 500 });
    }
}
