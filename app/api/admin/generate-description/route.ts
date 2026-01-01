import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";

export const dynamic = "force-dynamic";

// Initialize Anthropic client
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function POST(request: NextRequest) {
  // Verify authentication
  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if Anthropic is configured
  if (!anthropic) {
    return NextResponse.json(
      { error: "AI generation is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { productName, keywords, tone } = body as {
      productName: string;
      keywords?: string;
      tone?: "professional" | "casual" | "luxury" | "playful";
    };

    if (!productName || productName.trim().length === 0) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    // Build the prompt
    const toneInstructions = {
      professional: "Use a professional, trustworthy tone.",
      casual: "Use a friendly, conversational tone.",
      luxury: "Use an elegant, premium tone that conveys exclusivity.",
      playful: "Use a fun, energetic tone with personality.",
    };

    const selectedTone = tone && toneInstructions[tone]
      ? toneInstructions[tone]
      : toneInstructions.professional;

    const keywordContext = keywords && keywords.trim()
      ? `\nKeywords to incorporate naturally: ${keywords}`
      : "";

    const prompt = `You are an expert e-commerce copywriter. Write a compelling product description for the following product.

Product Name: ${productName.trim()}${keywordContext}

Requirements:
- Write 2-3 sentences maximum
- ${selectedTone}
- Focus on benefits and what the customer will experience
- Include a subtle call-to-action if natural
- Be SEO-friendly but sound natural and human
- Do NOT use generic phrases like "high-quality" or "best-in-class"
- Do NOT include the product name at the start

Respond with ONLY the product description, no quotes, no prefix, no explanation.`;

    // Call Claude API using Haiku for speed and cost
    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract the text response
    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    const description = textContent.text.trim();

    return NextResponse.json({
      description,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error("AI generation error:", error);

    // Handle specific Anthropic errors
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Too many requests. Please try again in a moment." },
          { status: 429 }
        );
      }
      if (error.status === 401) {
        return NextResponse.json(
          { error: "AI service configuration error" },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 }
    );
  }
}
