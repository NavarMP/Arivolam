import { Metadata } from 'next';
import { UniversalLoginForm } from '@/components/campus/universal-login-form';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Campus Login | Arivolam ERP',
    description: 'Sign into your institution\'s Arivolam Campus Management portal.',
};

export default function CampusLoginPage() {
    return (
        <div className="relative min-h-screen bg-background overflow-hidden flex flex-col items-center justify-center p-4">
            {/* Dynamic Background identical to auth layout */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
            </div>

            <div className="absolute top-6 left-6 md:left-8 z-20">
                <Link
                    href="/campus"
                    className="inline-flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to ERP Home
                </Link>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="mb-8 text-center text-foreground">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Campus Login</h1>
                    <p className="text-muted-foreground">
                        Sign in to access your institution's ERP.
                    </p>
                </div>

                <UniversalLoginForm />

                <p className="mt-8 text-center text-sm text-muted-foreground px-8">
                    By continuing, you agree to Arivolam's{' '}
                    <Link href="/legal/terms" className="underline underline-offset-4 hover:text-primary">
                        Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/legal/privacy" className="underline underline-offset-4 hover:text-primary">
                        Privacy Policy
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}
