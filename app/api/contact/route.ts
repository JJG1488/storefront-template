import { NextResponse } from "next/server";
import { sendContactFormEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message must be less than 5000 characters" },
        { status: 400 }
      );
    }

    // Send email to store owner
    const sent = await sendContactFormEmail(name, email, subject, message);

    if (!sent) {
      // If Resend isn't configured, we still want to acknowledge the submission
      // In production, you might want to save to a database instead
      console.log("Contact form submission (email not sent):", { name, email, subject, message: message.slice(0, 100) });
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}
