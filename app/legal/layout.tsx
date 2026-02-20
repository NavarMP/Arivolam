import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <div className="fixed left-4 right-4 top-4 z-50 flex items-center justify-between md:left-8 md:right-8">
                <Link href="/">
                    <Button variant="ghost" className="gap-2 rounded-xl bg-background/60 backdrop-blur-xl">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </Link>
                <ThemeToggle />
            </div>
            <main className="container mx-auto max-w-3xl px-4 pb-16 pt-24">
                {children}
            </main>
            <footer className="border-t border-border/30 py-6 text-center text-xs text-muted-foreground">
                <div className="container mx-auto flex flex-wrap items-center justify-center gap-4">
                    <Link href="/legal/terms" className="hover:text-foreground">Terms</Link>
                    <Link href="/legal/privacy" className="hover:text-foreground">Privacy</Link>
                    <Link href="/legal/documentation" className="hover:text-foreground">Documentation</Link>
                    <Link href="/contact" className="hover:text-foreground">Contact</Link>
                </div>
                <p className="mt-2">© {new Date().getFullYear()} Arivolam. All rights reserved.</p>
            </footer>
        </div>
    );
}
