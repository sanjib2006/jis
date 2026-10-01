import { streamText, isStepCount } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getCurrentUser } from "@/lib/auth";
import { getSystemPromptForRole } from "@/lib/ai/prompts";
import { createAiTools } from "@/lib/ai/tools";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized. Authentication session required." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "Gemini API key is not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY in your environment variables.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request payload. Expected 'messages' array." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

    const systemPrompt = getSystemPromptForRole(user.role);
    const tools = createAiTools(user);

    const result = streamText({
      model: google(modelName),
      system: systemPrompt,
      messages,
      tools,
      stopWhen: isStepCount(5),
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Judicial AI Assistant Route Error:", error);
    const message =
      error instanceof Error ? error.message : "Internal assistant error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
