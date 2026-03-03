import { getPeriods } from "../academic-actions";
import PeriodsClient from "./periods-client";

export default async function PeriodsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    let periods;
    try { periods = await getPeriods(slug); } catch (e: any) {
        return <div className="p-8 text-center text-destructive">{e.message}</div>;
    }
    return <PeriodsClient initialPeriods={periods} slug={slug} />;
}
