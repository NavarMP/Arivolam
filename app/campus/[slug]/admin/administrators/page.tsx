import { getAdministrators } from "./actions";
import AdministratorsClient from "./administrators-client";

export default async function AdministratorsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let admins;
    try {
        admins = await getAdministrators(slug);
    } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }
    return <AdministratorsClient admins={admins} slug={slug} />;
}
