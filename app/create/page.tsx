import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CreatePostPage } from "./create-page-client";

export const metadata = {
    title: "Create Post — Arivolam",
    description: "Share something with the Arivolam community",
};

export default async function CreatePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login?next=/create");

    return <CreatePostPage user={user} />;
}
