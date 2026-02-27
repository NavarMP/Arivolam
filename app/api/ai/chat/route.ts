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
- **Navigate users** to campus locations when asked (you can trigger map navigation!)

## Navigation Actions
When a user asks for directions or wants to find a building/room/facility, include a structured action block at the END of your response using this EXACT format:

\`\`\`action
{"type":"navigate","target":"<exact building name>"}
\`\`\`

OR to highlight a building:
\`\`\`action
{"type":"highlight","target":"<exact building name>"}
\`\`\`

OR to show a specific category:
\`\`\`action
{"type":"filter","category":"<category name>"}
\`\`\`

**Important navigation rules:**
- Use the EXACT building name from the campus data provided (case-sensitive match)
- Only trigger navigate/highlight when the user clearly wants to go somewhere or find something
- For informational questions about a building, use "highlight" instead of "navigate"
- Valid categories for filter: academic, facility, hostel, recreation, religious, food, transport
- You can include multiple action blocks if needed
- Always provide a helpful text response BEFORE the action block

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
    buildings?: { name: string; category: string; description?: string; floors?: number; operating_hours?: string }[];
    pois?: { name: string; category: string; description?: string }[];
    rooms?: { name: string; room_number?: string; room_type: string; building_name?: string; capacity?: number }[];
}) {
    if (!campusData?.institutionName) return "";

    let ctx = `\n\n## Current Campus: ${campusData.institutionName}\n`;

    if (campusData.buildings?.length) {
        ctx += `\n### Buildings (use these EXACT names for navigation actions)\n`;
        campusData.buildings.forEach((b) => {
            ctx += `- **${b.name}** (${b.category})`;
            if (b.description) ctx += `: ${b.description}`;
            if (b.floors) ctx += ` [${b.floors} floor${b.floors > 1 ? "s" : ""}]`;
            if (b.operating_hours) ctx += ` Hours: ${b.operating_hours}`;
            ctx += `\n`;
        });
    }

    if (campusData.pois?.length) {
        ctx += `\n### Points of Interest\n`;
        campusData.pois.forEach((p) => {
            ctx += `- **${p.name}** (${p.category})${p.description ? `: ${p.description}` : ""}\n`;
        });
    }

    if (campusData.rooms?.length) {
        ctx += `\n### Rooms & Facilities\n`;
        campusData.rooms.forEach((r) => {
            ctx += `- **${r.name}**`;
            if (r.room_number) ctx += ` (${r.room_number})`;
            ctx += ` — ${r.room_type.replace("_", " ")}`;
            if (r.building_name) ctx += ` in ${r.building_name}`;
            if (r.capacity) ctx += `, ${r.capacity} seats`;
            ctx += `\n`;
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
        const { message, history = [], campusData, mode } = body as {
            message: string;
            history?: ChatMessage[];
            campusData?: {
                institutionName?: string;
                buildings?: { name: string; category: string; description?: string; floors?: number; operating_hours?: string }[];
                pois?: { name: string; category: string; description?: string }[];
                rooms?: { name: string; room_number?: string; room_type: string; building_name?: string; capacity?: number }[];
            };
            mode?: "campus" | "social";
        };

        if (!message?.trim()) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Build full system instruction with campus context + mode-specific focus
        let systemInstruction = SYSTEM_PROMPT + buildCampusContext(campusData);

        if (mode === "social") {
            systemInstruction += `\n\n## Current Context: Ariv Social
You are currently assisting a user on the Ariv Social feed. Focus on:
- Helping create and share posts
- Finding and connecting with other users
- Exploring social feed features
- Understanding notification and profile settings
- General platform navigation tips`;
        } else if (mode === "campus") {
            systemInstruction += `\n\n## Current Context: Campusolam
You are assisting a user within their campus portal. Focus on:
- Campus navigation and building/room locations — USE ACTION BLOCKS to navigate!
- Academic schedules, courses, and grades
- Campus events and announcements
- Institution-specific features and services
- When a user asks "where is X" or "take me to X" or "how to get to X", ALWAYS include a navigate action`;
        }

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

        // Parse any action blocks from the response
        const actions: { type: string; target?: string; category?: string }[] = [];
        const actionRegex = /```action\s*\n({[^}]+})\s*\n```/g;
        let match;
        while ((match = actionRegex.exec(text)) !== null) {
            try {
                const action = JSON.parse(match[1]);
                actions.push(action);
            } catch {
                // Ignore malformed action blocks
            }
        }

        // Clean the response text (remove action blocks from display text)
        const cleanText = text.replace(/```action\s*\n{[^}]+}\s*\n```/g, "").trim();

        return NextResponse.json({
            response: cleanText,
            actions: actions.length > 0 ? actions : undefined,
        });
    } catch (error: unknown) {
        console.error("AI Chat Error:", error);
        const msg = error instanceof Error ? error.message : "An unexpected error occurred";
        return NextResponse.json(
            { error: msg },
            { status: 500 }
        );
    }
}
