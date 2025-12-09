"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { User, GraduationCap, School, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { login, signup } from "@/app/login/actions"; // Import server actions
import { useTransition } from "react";

const roles = [
    { id: "student", label: "Student", icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "teacher", label: "Teacher", icon: School, color: "text-green-500", bg: "bg-green-500/10" },
    { id: "parent", label: "Parent", icon: User, color: "text-orange-500", bg: "bg-orange-500/10" },
    { id: "admin", label: "Admin", icon: ShieldCheck, color: "text-red-500", bg: "bg-red-500/10" },
];

export function LoginForm() {
    const [selectedRole, setSelectedRole] = React.useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    return (
        <div className="w-full max-w-md space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Select your role to access the Arivolam Digital Campus.
                </p>
            </div>

            {/* Note: Roles are currently UI-only. You would likely pass 'role' to the server action or store it in state to submit. 
                 For now, we keep the UI but the auth actions are standard email/password. 
            */}
            <div className="grid grid-cols-2 gap-4">
                {roles.map((role) => (
                    <motion.div
                        key={role.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedRole(role.id)}
                        className={cn(
                            "cursor-pointer rounded-xl border-2 p-4 transition-all duration-200",
                            selectedRole === role.id
                                ? "border-primary bg-primary/5 ring-2 ring-primary ring-opacity-50"
                                : "border-border bg-card hover:border-primary/50"
                        )}
                    >
                        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${role.bg}`}>
                            <role.icon className={`h-6 w-6 ${role.color}`} />
                        </div>
                        <div className="font-semibold">{role.label}</div>
                    </motion.div>
                ))}
            </div>

            <form>
                <div className="space-y-4">
                    <div className="relative">
                        <input
                            name="email"
                            type="email"
                            placeholder="Email Address"
                            required
                            className="w-full rounded-md border border-input bg-background/50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                    <div className="relative">
                        <input
                            name="password"
                            type="password"
                            placeholder="Password"
                            required
                            className="w-full rounded-md border border-input bg-background/50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="flex gap-4">
                        <Button
                            className="w-full"
                            size="lg"
                            formAction={login}
                            disabled={!selectedRole || isPending}
                        >
                            {isPending ? "Logging in..." : "Login"}
                            {!isPending && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>
                        <Button
                            className="w-full"
                            size="lg"
                            variant="outline"
                            formAction={signup}
                            disabled={!selectedRole || isPending}
                        >
                            Sign Up
                        </Button>
                    </div>
                </div>
            </form>

            <p className="px-8 text-center text-sm text-muted-foreground">
                By clicking login, you agree to our{" "}
                <a href="#" className="underline underline-offset-4 hover:text-primary">
                    Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="underline underline-offset-4 hover:text-primary">
                    Privacy Policy
                </a>
                .
            </p>
        </div>
    );
}
