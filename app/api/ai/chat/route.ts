import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── System prompt with campus-aware context ───
const SYSTEM_PROMPT = `You are **Arivolam AI**, the intelligent campus assistant built into the Arivolam digital campus platform. You are helpful, concise, and friendly.

## Your Capabilities
- Answer questions about campus facilities, buildings, rooms, and navigation
- Help with academic queries (courses, schedules, exams)
- Provide information about campus events and activities
- Guide users through the Arivolam platform features
- Offer general academic help and study tips

## Guidelines
- Be concise but thorough — prefer bullet points for lists
- Use emojis sparingly for a friendly tone ✨
- If asked about something you don't know, say so honestly
- Always be respectful and supportive
- If a question is about a specific campus, use the provided campus context
- Format responses with markdown for readability
- Keep responses under 300 words unless the user asks for detailed explanations

## Platform Context
Arivolam ("The Horizon of Learning") is a campus management and social platform that includes:
- Social feed for campus communities
- Campus navigation with interactive maps
- Academic management (courses, grades, attendance)
- Event calendar
- Institution-specific portals`;

// ─── Build campus context string ───
function buildCampusContext(campusData?: {
    institutionName?: string;
    buildings?: { name: string; category: string; description?: string }[];
    pois?: { name: string; category: string }[];
}) {
    if (!campusData?.institutionName) return "";

    let ctx = `\n\n## Current Campus: ${campusData.institutionName}\n`;

    if (campusData.buildings?.length) {
        ctx += `\n### Buildings\n`;
        campusData.buildings.forEach((b) => {
            ctx += `- **${b.name}** (${b.category})${b.description ? `: ${b.description}` : ""}\n`;
        });
    }

    if (campusData.pois?.length) {
        ctx += `\n### Points of Interest\n`;
        campusData.pois.forEach((p) => {
            ctx += `- **${p.name}** (${p.category})\n`;
        });
    }

    return ctx;
}

// ─── Message type ───
interface ChatMessage {
    role: "user" | "model";
    content: string;
}

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "Gemini API key not configured" },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { message, history = [], campusData } = body as {
            message: string;
            history?: ChatMessage[];
            campusData?: {
                institutionName?: string;
                buildings?: { name: string; category: string; description?: string }[];
                pois?: { name: string; category: string }[];
            };
        };

        if (!message?.trim()) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Build full system instruction with campus context
        const systemInstruction = SYSTEM_PROMPT + buildCampusContext(campusData);

        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            systemInstruction,
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.7,
                topP: 0.95,
            },
        });

        // Build chat history in Gemini format
        const chatHistory = history.map((msg) => ({
            role: msg.role as "user" | "model",
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(message.trim());
        const response = result.response;
        const text = response.text() || "I couldn't generate a response. Please try again.";

        return NextResponse.json({ response: text });
    } catch (error: unknown) {
        console.error("AI Chat Error:", error);
        const msg = error instanceof Error ? error.message : "An unexpected error occurred";
        return NextResponse.json(
            { error: msg },
            { status: 500 }
        );
    }
}
