"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AdaptiveLogoProps {
    size?: number;
    className?: string;
}

export function AdaptiveLogo({ size = 32, className }: AdaptiveLogoProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Prevent hydration mismatch — show neutral version until mounted
    const isDark = mounted ? resolvedTheme === "dark" : false;

    // Blue paths (#012d49) become light (#e8edf2) in dark mode
    const blueColor = isDark ? "#e8edf2" : "#012d49";
    // Orange stays the same in both themes
    const orangeColor = "#ef8119";

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1024 1024"
            width={size}
            height={size}
            className={cn("transition-colors duration-300", className)}
            aria-label="Arivolam Logo"
        >
            {/* Arrow / chevron top — adapts to theme */}
            <path
                fill={blueColor}
                d="M549.26,297.87l161.51,161.51c9.88,9.88,23.29,15.43,37.26,15.43h0c46.95,0,70.46-56.76,37.26-89.96l-236.03-236.03c-20.58-20.58-53.94-20.58-74.52,0l-236.03,236.03c-33.2,33.2-9.69,89.96,37.26,89.96h0c13.98,0,27.38-5.55,37.26-15.43l161.51-161.51c20.58-20.58,53.94-20.58,74.52,0Z"
            />
            {/* Stadium / capsule bottom — adapts to theme */}
            <path
                fill={blueColor}
                d="M619.21,633.06c41.98,0,76.12,34.15,76.12,76.13s-34.15,76.12-76.12,76.12h-214.42c-41.98,0-76.12-34.15-76.12-76.13s34.15-76.12,76.12-76.12h214.42M619.21,527.56h-214.42c-100.31,0-181.62,81.32-181.62,181.62h0c0,100.31,81.32,181.63,181.62,181.63h214.42c100.31,0,181.62-81.32,181.62-181.62h0c0-100.31-81.32-181.63-181.62-181.63h0Z"
            />
            {/* Orange arc — stays brand orange */}
            <path
                fill={orangeColor}
                d="M512,474.81c-77.15,0-149.68-30.04-204.24-84.6-54.55-54.55-84.6-127.09-84.6-204.24,0-29.16,23.64-52.79,52.79-52.79s52.79,23.64,52.79,52.79c0,101.05,82.21,183.25,183.25,183.25s183.25-82.21,183.25-183.25c0-29.16,23.64-52.79,52.79-52.79s52.79,23.64,52.79,52.79c0,77.15-30.04,149.68-84.6,204.24-54.55,54.55-127.09,84.6-204.24,84.6Z"
            />
        </svg>
    );
}
