"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface ScrollDirectionResult {
    scrollDirection: "up" | "down";
    isAtTop: boolean;
    isNavVisible: boolean;
}

/**
 * Tracks scroll direction to auto-hide/show navigation.
 * @param threshold - Minimum scroll delta before triggering direction change
 * @param topOffset - Distance from top to always show nav
 */
export function useScrollDirection(
    threshold: number = 10,
    topOffset: number = 50
): ScrollDirectionResult {
    const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
    const [isAtTop, setIsAtTop] = useState(true);
    const lastScrollY = useRef(0);
    const ticking = useRef(false);

    const updateScrollDir = useCallback(() => {
        const scrollY = window.scrollY;

        setIsAtTop(scrollY < topOffset);

        if (Math.abs(scrollY - lastScrollY.current) < threshold) {
            ticking.current = false;
            return;
        }

        const newDirection = scrollY > lastScrollY.current ? "down" : "up";
        setScrollDirection(newDirection);
        lastScrollY.current = scrollY > 0 ? scrollY : 0;
        ticking.current = false;
    }, [threshold, topOffset]);

    useEffect(() => {
        const onScroll = () => {
            if (!ticking.current) {
                window.requestAnimationFrame(updateScrollDir);
                ticking.current = true;
            }
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [updateScrollDir]);

    const isNavVisible = scrollDirection === "up" || isAtTop;

    return { scrollDirection, isAtTop, isNavVisible };
}
