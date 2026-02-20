"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageCircle,
    X,
    Send,
    Sparkles,
    Bot,
    User,
    Loader2,
    MapPin,
    BookOpen,
    Calendar,
    HelpCircle,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ───
interface ChatMessage {
    id: string;
    role: "user" | "model";
    content: string;
    timestamp: Date;
}

interface CampusContext {
    institutionName?: string;
    buildings?: { name: string; category: string; description?: string }[];
    pois?: { name: string; category: string }[];
}

interface AIChatWidgetProps {
    campusContext?: CampusContext;
}

// ─── Quick action buttons ───
const QUICK_ACTIONS = [
    { label: "Navigate campus", icon: MapPin, prompt: "Help me navigate around the campus. What buildings are available?" },
    { label: "Academics help", icon: BookOpen, prompt: "Can you help me with academic information?" },
    { label: "Events today", icon: Calendar, prompt: "What events or activities might be happening on campus today?" },
    { label: "How to use Arivolam", icon: HelpCircle, prompt: "How do I use the Arivolam platform? What features are available?" },
];

// ─── Simple markdown-like renderer ───
function renderMessage(text: string) {
    // Split by **bold** and render
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={i} className="font-semibold">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        // Handle line breaks
        const lines = part.split("\n");
        return lines.map((line, j) => (
            <span key={`${i}-${j}`}>
                {j > 0 && <br />}
                {line.startsWith("- ") ? (
                    <span className="ml-2">• {line.slice(2)}</span>
                ) : (
                    line
                )}
            </span>
        ));
    });
}

export function AIChatWidget({ campusContext }: AIChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const sendMessage = useCallback(
        async (text: string) => {
            if (!text.trim() || isLoading) return;

            const userMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "user",
                content: text.trim(),
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setInput("");
            setIsLoading(true);
            setShowQuickActions(false);

            try {
                const history = messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                }));

                const res = await fetch("/api/ai/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: text.trim(),
                        history,
                        campusData: campusContext,
                    }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Failed to get response");
                }

                const aiMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: "model",
                    content: data.response,
                    timestamp: new Date(),
                };

                setMessages((prev) => [...prev, aiMessage]);
            } catch (error) {
                const errorMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: "model",
                    content:
                        "Sorry, I couldn't process that request. Please try again. 🙏",
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, errorMessage]);
                console.error("AI Chat Error:", error);
            } finally {
                setIsLoading(false);
            }
        },
        [isLoading, messages, campusContext]
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const clearChat = () => {
        setMessages([]);
        setShowQuickActions(true);
    };

    return (
        <>
            {/* Floating action button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-24 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 transition-shadow hover:shadow-xl hover:shadow-primary/30 md:bottom-6 md:right-6"
                        aria-label="Open AI Assistant"
                    >
                        <Sparkles className="h-6 w-6" />

                        {/* Pulse ring */}
                        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/20" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-20 right-2 left-2 z-[60] flex h-[min(500px,70vh)] flex-col overflow-hidden rounded-2xl border border-border/50 bg-background shadow-2xl shadow-black/10 md:bottom-4 md:right-4 md:left-auto md:h-[min(600px,85vh)] md:w-[min(400px,calc(100vw-2rem))]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                                    <Bot className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold">Arivolam AI</h3>
                                    <p className="text-[10px] text-muted-foreground">
                                        {campusContext?.institutionName
                                            ? `${campusContext.institutionName} assistant`
                                            : "Your campus assistant"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {messages.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                                        onClick={clearChat}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages area */}
                        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3 scrollbar-hide">
                            {/* Welcome message */}
                            {messages.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center py-6 text-center"
                                >
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
                                        <Sparkles className="h-8 w-8 text-primary" />
                                    </div>
                                    <h4 className="text-base font-semibold">
                                        Hi! I&apos;m Arivolam AI ✨
                                    </h4>
                                    <p className="mt-1 text-xs text-muted-foreground max-w-[260px]">
                                        I can help you navigate campus, answer academic questions, and
                                        explore Arivolam features.
                                    </p>
                                </motion.div>
                            )}

                            {/* Quick actions */}
                            {showQuickActions && messages.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="grid grid-cols-2 gap-2"
                                >
                                    {QUICK_ACTIONS.map((action) => (
                                        <button
                                            key={action.label}
                                            onClick={() => sendMessage(action.prompt)}
                                            className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-left text-xs font-medium transition-all hover:bg-muted hover:border-primary/30 hover:shadow-sm"
                                        >
                                            <action.icon className="h-4 w-4 shrink-0 text-primary" />
                                            <span className="line-clamp-2">{action.label}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}

                            {/* Chat messages */}
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                                >
                                    <div
                                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${msg.role === "user"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-primary/10 text-primary"
                                            }`}
                                    >
                                        {msg.role === "user" ? (
                                            <User className="h-3.5 w-3.5" />
                                        ) : (
                                            <Bot className="h-3.5 w-3.5" />
                                        )}
                                    </div>
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-br-md"
                                            : "bg-muted/80 text-foreground rounded-bl-md"
                                            }`}
                                    >
                                        {renderMessage(msg.content)}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing indicator */}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-2"
                                >
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Bot className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="rounded-2xl rounded-bl-md bg-muted/80 px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                                                style={{ animationDelay: "0ms" }}
                                            />
                                            <span
                                                className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                                                style={{ animationDelay: "150ms" }}
                                            />
                                            <span
                                                className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                                                style={{ animationDelay: "300ms" }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input area */}
                        <div className="border-t border-border/50 bg-muted/20 p-3">
                            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask me anything..."
                                    disabled={isLoading}
                                    className="flex-1 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!input.trim() || isLoading}
                                    className="h-10 w-10 shrink-0 rounded-xl"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </form>
                            <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
                                Powered by Gemini AI • Responses may not always be accurate
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
