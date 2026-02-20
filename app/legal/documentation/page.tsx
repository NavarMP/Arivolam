import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Documentation | Arivolam",
    description: "Arivolam platform documentation — guides, API references, and getting started.",
};

export default function DocumentationPage() {
    const sections = [
        {
            title: "Getting Started",
            items: [
                { title: "Creating an Account", description: "Sign up with email or social providers" },
                { title: "Setting Up Your Profile", description: "Choose your profile type and claim a username" },
                { title: "Joining an Institution", description: "Use institution credentials to access campus features" },
            ],
        },
        {
            title: "Feed & Social",
            items: [
                { title: "Creating Posts", description: "Share text, images, and videos with the community" },
                { title: "Reactions & Comments", description: "Engage with posts using reactions and comments" },
                { title: "Following Users", description: "Build your network by following other users" },
            ],
        },
        {
            title: "Campus Management",
            items: [
                { title: "Institution Dashboard", description: "Admin tools for managing your campus" },
                { title: "User Roles", description: "Understanding student, faculty, and admin roles" },
                { title: "Campus Pages", description: "Public campus pages and visitor access" },
            ],
        },
        {
            title: "For Developers",
            items: [
                { title: "Tech Stack", description: "Next.js 16, Supabase, Tailwind CSS, Framer Motion, GSAP" },
                { title: "Database Schema", description: "PostgreSQL schema with RLS policies" },
                { title: "Authentication", description: "Supabase Auth with OAuth and email/password" },
            ],
        },
    ];

    return (
        <div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight">Documentation</h1>
            <p className="mb-8 text-muted-foreground">
                Everything you need to know about using and building on Arivolam.
            </p>

            <div className="space-y-8">
                {sections.map((section) => (
                    <div key={section.title}>
                        <h2 className="mb-3 text-lg font-bold">{section.title}</h2>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {section.items.map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-xl border border-border/40 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                                >
                                    <h3 className="text-sm font-semibold">{item.title}</h3>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 rounded-xl border border-border/40 bg-primary/5 p-6 text-center">
                <h3 className="mb-1 text-sm font-bold">Need More Help?</h3>
                <p className="mb-3 text-xs text-muted-foreground">
                    Can&apos;t find what you&apos;re looking for? Our AI assistant and team are here to help.
                </p>
                <Link href="/contact"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                    Contact Support →
                </Link>
            </div>
        </div>
    );
}
