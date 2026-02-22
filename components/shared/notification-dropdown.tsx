"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/utils/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string | null;
    link: string | null;
    is_read: boolean;
    created_at: string;
    actor_id: string | null;
}

export function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();
        const { data } = await supabase
            .from("notifications")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter((n) => !n.is_read).length);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    // Poll for unread count
    useEffect(() => {
        const checkUnread = async () => {
            const supabase = createClient();
            const { count } = await supabase
                .from("notifications")
                .select("*", { count: "exact", head: true })
                .eq("is_read", false);
            setUnreadCount(count || 0);
        };

        checkUnread();
        const interval = setInterval(checkUnread, 30000); // Every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string) => {
        const supabase = createClient();
        await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", id);

        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const markAllAsRead = async () => {
        const supabase = createClient();
        await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("is_read", false);

        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "like":
                return "👍";
            case "comment":
                return "💬";
            case "follow":
                return "👤";
            case "mention":
                return "📢";
            case "campus_invite":
                return "🏫";
            default:
                return "🔔";
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 rounded-full"
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 p-0"
                align="end"
                sideOffset={8}
            >
                <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs text-muted-foreground"
                            onClick={markAllAsRead}
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Mark all read
                        </Button>
                    )}
                </div>

                <ScrollArea className="max-h-80">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className="divide-y divide-border/50">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${!notification.is_read
                                            ? "bg-primary/5"
                                            : ""
                                        }`}
                                    onClick={() => {
                                        if (!notification.is_read) {
                                            markAsRead(notification.id);
                                        }
                                        if (notification.link) {
                                            window.location.href = notification.link;
                                        }
                                    }}
                                >
                                    <span className="mt-0.5 text-base leading-none">
                                        {getTypeIcon(notification.type)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium leading-tight">
                                            {notification.title}
                                        </p>
                                        {notification.body && (
                                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                                {notification.body}
                                            </p>
                                        )}
                                        <p className="mt-1 text-[10px] text-muted-foreground/60">
                                            {formatDistanceToNow(
                                                new Date(notification.created_at),
                                                { addSuffix: true }
                                            )}
                                        </p>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-12 text-center">
                            <Bell className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                No notifications yet
                            </p>
                            <p className="text-xs text-muted-foreground/60">
                                We&apos;ll let you know when something happens
                            </p>
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
