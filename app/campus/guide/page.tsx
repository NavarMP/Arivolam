import { Metadata } from "next";
import GuideClient from "@/app/campus/[slug]/guide/guide-client";

export const metadata: Metadata = {
    title: "How to Use | Campusolam",
    description:
        "A comprehensive guide to using Campusolam — managing departments, classes, attendance, marks, campus maps, and more.",
};

export default function PublicGuidePage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-4xl py-6 px-4">
                <GuideClient />
            </div>
        </div>
    );
}
