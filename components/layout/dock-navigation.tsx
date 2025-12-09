"use client";

import React, { useRef } from "react";
import { MotionValue, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";

export interface DockItem {
    title: string;
    icon: LucideIcon;
    href: string;
}

interface DockProps {
    items: DockItem[];
    className?: string;
}

export function DockNavigation({ items, className }: DockProps) {
    const mouseX = useMotionValue(Infinity);

    return (
        <motion.div
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className={cn(
                "mx-auto flex h-16 items-end gap-2 rounded-2xl border border-border bg-background/80 px-4 pb-2 backdrop-blur-md dark:border-border/40",
                className
            )}
        >
            {items.map((item) => (
                <DockIcon key={item.title} mouseX={mouseX} item={item} />
            ))}
        </motion.div>
    );
}

function DockIcon({
    mouseX,
    item,
}: {
    mouseX: MotionValue;
    item: DockItem;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const isActive = pathname === item.href;

    const distance = useTransform(mouseX, (val) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    const widthSync = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
    const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

    return (
        <Link href={item.href} className="group relative">
            {isActive && (
                <div className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
            )}
            <motion.div
                ref={ref}
                style={{ width }}
                className={cn(
                    "flex aspect-square flex-col items-center justify-center rounded-full border border-border bg-background/80 shadow-sm transition-colors hover:bg-muted/80",
                    isActive ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground"
                )}
            >
                <item.icon className="h-2/5 w-2/5" />
            </motion.div>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md">
                    {item.title}
                </div>
            </div>
        </Link>
    );
}
