import { getInstitutionDetails } from "./actions";
import SettingsClient from "./settings-client";

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let institution;
    try {
        institution = await getInstitutionDetails(slug);
    } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }
    return <SettingsClient institution={institution} slug={slug} />;
}
