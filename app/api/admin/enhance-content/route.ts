import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuthFromRequest } from "@/lib/admin-tokens";

export const dynamic = "force-dynamic";

// Content types supported by the enhance API
type ContentType =
  | "collection"
  | "about"
  | "faq"
  | "shipping"
  | "returns"
  | "service"
  | "generic";

interface EnhanceRequest {
  contentType: ContentType;
  contextName: string;
  currentText?: string;
  additionalContext?: string;
}

// Initialize Anthropic client
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Content type configurations with smart defaults
const contentConfig: Record<
  ContentType,
  {
    maxTokens: number;
    label: string;
    prompt: (ctx: { contextName: string; currentText?: string; additionalContext?: string }) => string;
  }
> = {
  collection: {
    maxTokens: 150,
    label: "collection description",
    prompt: ({ contextName, currentText, additionalContext }) => {
      const base = `You are an expert e-commerce copywriter. Write a compelling description for a product collection/category called "${contextName}".${additionalContext ? ` This is for a ${additionalContext}.` : ""}`;

      if (currentText?.trim()) {
        return `${base}

The user has written this draft: "${currentText}"

Improve it while keeping the core idea. Make it more engaging and enticing to browse.

Requirements:
- 1-2 sentences maximum (under 100 words)
- Describe what customers will find in this collection
- Create excitement to browse the products
- Be specific, not generic
- Sound natural and human

Respond with ONLY the description, no quotes, no prefix.`;
      }

      return `${base}

Requirements:
- 1-2 sentences maximum (under 100 words)
- Describe what customers will find in this collection
- Create excitement to browse the products
- Be specific, not generic
- Sound natural and human

Respond with ONLY the description, no quotes, no prefix.`;
    },
  },

  about: {
    maxTokens: 250,
    label: "about section",
    prompt: ({ contextName, currentText }) => {
      const base = `You are an expert copywriter. Write an "About" section for "${contextName}".`;

      if (currentText?.trim()) {
        return `${base}

The user has written this draft: "${currentText}"

Improve it while keeping the core message and brand voice. Make it more engaging and memorable.

Requirements:
- 2-3 short paragraphs (100-150 words total)
- Focus on the story, mission, or unique value
- Use "we" or "I" perspective appropriately
- Be authentic and personable, not corporate
- Include a subtle call-to-action at the end
- Sound natural and human

Respond with ONLY the about text, no quotes, no prefix.`;
      }

      return `${base}

Requirements:
- 2-3 short paragraphs (100-150 words total)
- Focus on the story, mission, or unique value
- Use "we" or "I" perspective appropriately
- Be authentic and personable, not corporate
- Include a subtle call-to-action at the end
- Sound natural and human

Respond with ONLY the about text, no quotes, no prefix.`;
    },
  },

  faq: {
    maxTokens: 150,
    label: "FAQ answer",
    prompt: ({ contextName, currentText }) => {
      const base = `You are a helpful customer service expert. Write a clear, helpful answer for this FAQ question: "${contextName}"`;

      if (currentText?.trim()) {
        return `${base}

The current answer is: "${currentText}"

Improve it to be clearer, more helpful, and more friendly.

Requirements:
- 1-3 sentences maximum
- Be direct and helpful
- Use a friendly, conversational tone
- Answer the question completely
- Sound natural and human

Respond with ONLY the answer, no quotes, no prefix.`;
      }

      return `${base}

Requirements:
- 1-3 sentences maximum
- Be direct and helpful
- Use a friendly, conversational tone
- Answer the question completely
- Sound natural and human

Respond with ONLY the answer, no quotes, no prefix.`;
    },
  },

  shipping: {
    maxTokens: 120,
    label: "shipping policy",
    prompt: ({ contextName, currentText }) => {
      const base = `You are a professional e-commerce copywriter. Write clear shipping policy information for "${contextName}".`;

      if (currentText?.trim()) {
        return `${base}

The current text is: "${currentText}"

Improve it to be clearer and more reassuring to customers.

Requirements:
- 1-2 sentences maximum
- Be clear and professional
- Reassure customers about delivery
- Include relevant details (timeframes, international info)
- Sound natural and human

Respond with ONLY the policy text, no quotes, no prefix.`;
      }

      return `${base}

Requirements:
- 1-2 sentences maximum
- Be clear and professional
- Reassure customers about delivery
- Include placeholder timeframes like "X-Y business days"
- Sound natural and human

Respond with ONLY the policy text, no quotes, no prefix.`;
    },
  },

  returns: {
    maxTokens: 120,
    label: "returns policy",
    prompt: ({ contextName, currentText }) => {
      const base = `You are a professional e-commerce copywriter. Write clear returns/exchange policy information for "${contextName}".`;

      if (currentText?.trim()) {
        return `${base}

The current text is: "${currentText}"

Improve it to be clearer and more customer-friendly.

Requirements:
- 1-2 sentences maximum
- Be clear and customer-friendly
- Build trust and reduce purchase anxiety
- Explain the exchange process briefly
- Sound natural and human

Respond with ONLY the policy text, no quotes, no prefix.`;
      }

      return `${base}

Requirements:
- 1-2 sentences maximum
- Be clear and customer-friendly
- Build trust and reduce purchase anxiety
- Include placeholder timeframes like "within X days"
- Sound natural and human

Respond with ONLY the policy text, no quotes, no prefix.`;
    },
  },

  service: {
    maxTokens: 200,
    label: "service description",
    prompt: ({ contextName, currentText }) => {
      const base = `You are an expert service business copywriter. Write a compelling description for a service called "${contextName}".`;

      if (currentText?.trim()) {
        return `${base}

The user has written this draft: "${currentText}"

Improve it while keeping the core message. Make it more compelling and benefit-focused.

Requirements:
- 2-3 sentences maximum (under 80 words)
- Focus on benefits and outcomes for the customer
- Highlight expertise and professionalism
- Include a subtle call-to-action
- Sound natural and human

Respond with ONLY the description, no quotes, no prefix.`;
      }

      return `${base}

Requirements:
- 2-3 sentences maximum (under 80 words)
- Focus on benefits and outcomes for the customer
- Highlight expertise and professionalism
- Include a subtle call-to-action
- Sound natural and human

Respond with ONLY the description, no quotes, no prefix.`;
    },
  },

  generic: {
    maxTokens: 150,
    label: "content",
    prompt: ({ contextName, currentText }) => {
      const base = `You are an expert copywriter. Write compelling content for: "${contextName}".`;

      if (currentText?.trim()) {
        return `${base}

The user has written: "${currentText}"

Improve it while keeping the core message.

Requirements:
- Be concise and clear
- Sound professional but approachable
- Sound natural and human

Respond with ONLY the improved text, no quotes, no prefix.`;
      }

      return `${base}

Requirements:
- Be concise and clear
- Sound professional but approachable
- Sound natural and human

Respond with ONLY the text, no quotes, no prefix.`;
    },
  },
};

export async function POST(request: NextRequest) {
  // Verify authentication
  if (!(await verifyAuthFromRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if Anthropic is configured
  if (!anthropic) {
    return NextResponse.json(
      { error: "AI enhancement is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as EnhanceRequest;
    const { contentType, contextName, currentText, additionalContext } = body;

    // Validate required fields
    if (!contextName || contextName.trim().length === 0) {
      return NextResponse.json(
        { error: "Context name is required" },
        { status: 400 }
      );
    }

    // Get content configuration
    const config = contentConfig[contentType] || contentConfig.generic;

    // Build the prompt
    const prompt = config.prompt({
      contextName: contextName.trim(),
      currentText: currentText?.trim(),
      additionalContext: additionalContext?.trim(),
    });

    // Call Claude API using Haiku for speed and cost
    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: config.maxTokens,
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

    const result = textContent.text.trim();

    return NextResponse.json({
      result,
      contentType,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error("AI enhancement error:", error);

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
      { error: "Failed to enhance content" },
      { status: 500 }
    );
  }
}
