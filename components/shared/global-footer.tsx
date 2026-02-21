"use client";

import Link from "next/link";
import { AdaptiveLogo } from "@/components/shared/adaptive-logo";
import { Github, Twitter, Instagram, Linkedin, Heart } from "lucide-react";

export function GlobalFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto max-w-7xl px-4 py-12 md:py-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">

                    {/* Brand & Mission */}
                    <div className="md:col-span-2 lg:col-span-2">
                        <Link href="/" className="mb-4 inline-flex items-center gap-2">
                            <AdaptiveLogo size={32} />
                            <span className="text-xl font-bold tracking-tight">Arivolam</span>
                        </Link>
                        <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
                            The Horizon of Learning. A unified digital ecosystem empowering
                            educational institutions with modern networking and smart campus management.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="https://x.com/Navar_MP" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/20 hover:text-primary">
                                <Twitter className="h-4 w-4" />
                                <span className="sr-only">X</span>
                            </a>
                            <a href="https://instagram.com/Navar_MP" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/20 hover:text-primary">
                                <Instagram className="h-4 w-4" />
                                <span className="sr-only">Instagram</span>
                            </a>
                            <a href="https://LinkedIn.com/in/NavarMP" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/20 hover:text-primary">
                                <Linkedin className="h-4 w-4" />
                                <span className="sr-only">LinkedIn</span>
                            </a>
                            <a href="https://Github.com/NavarMP/Arivolam/" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/20 hover:text-primary">
                                <Github className="h-4 w-4" />
                                <span className="sr-only">GitHub</span>
                            </a>
                        </div>
                    </div>

                    {/* Social Platform */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-foreground">Social App</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link href="/" className="transition-colors hover:text-primary">Feed</Link>
                            </li>
                            <li>
                                <Link href="/explore" className="transition-colors hover:text-primary">Explore Institutions</Link>
                            </li>
                            <li>
                                <Link href="/about" className="transition-colors hover:text-primary">About Us</Link>
                            </li>
                            <li>
                                <Link href="/future" className="transition-colors hover:text-primary">Future Roadmap</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Campus ERP */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-foreground">Campus ERP</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link href="/campus" className="transition-colors hover:text-primary">ERP Features</Link>
                            </li>
                            <li>
                                <Link href="/campus/login" className="transition-colors hover:text-primary">Universal Login</Link>
                            </li>
                            <li>
                                <span className="cursor-not-allowed opacity-50">Register Institution</span>
                            </li>
                            <li>
                                <span className="cursor-not-allowed opacity-50">API Documentation</span>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-foreground">Legal</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link href="/legal/terms" className="transition-colors hover:text-primary">Terms of Service</Link>
                            </li>
                            <li>
                                <Link href="/legal/privacy" className="transition-colors hover:text-primary">Privacy Policy</Link>
                            </li>
                            <li>
                                <Link href="/legal/documentation" className="transition-colors hover:text-primary">Cookie Policy</Link>
                            </li>
                            <li>
                                <Link href="/contact" className="transition-colors hover:text-primary">Contact Us</Link>
                            </li>
                        </ul>
                    </div>

                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 sm:flex-row">
                    <p className="text-sm text-muted-foreground">
                        © {currentYear} Arivolam. All rights reserved.
                    </p>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        Built with <Heart className="h-4 w-4 fill-red-500 text-red-500 animate-pulse" /> by students, for students.
                    </p>
                </div>
            </div>
        </footer>
    );
}
