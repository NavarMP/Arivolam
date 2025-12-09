import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoveLeft } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4 md:p-8">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 opacity-50 blur-[100px]" />
                <div className="absolute right-0 top-0 h-[300px] w-[300px] bg-blue-500/10 opacity-30 blur-[80px]" />
                <div className="absolute bottom-0 left-0 h-[300px] w-[300px] bg-purple-500/10 opacity-30 blur-[80px]" />
            </div>

            <div className="absolute left-4 top-4 z-20 md:left-8 md:top-8">
                <Link href="/">
                    <Button variant="ghost" className="gap-2">
                        <MoveLeft className="h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>
            </div>

            <div className="z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
                <LoginForm />
            </div>
        </div>
    );
}
