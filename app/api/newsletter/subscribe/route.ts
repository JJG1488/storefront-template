import { NextResponse } from "next/server";
import { sendNewsletterWelcome } from "@/lib/email";
import { getSupabaseAdmin, getStoreId } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
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

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Get Supabase client and store ID
    const supabase = getSupabaseAdmin();
    const storeId = getStoreId();

    if (!supabase || !storeId) {
      console.error("Supabase not configured or store ID missing");
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, unsubscribed_at")
      .eq("store_id", storeId)
      .eq("email", normalizedEmail)
      .single();

    if (existing) {
      // If they unsubscribed before, resubscribe them
      if (existing.unsubscribed_at) {
        await supabase
          .from("newsletter_subscribers")
          .update({ unsubscribed_at: null, subscribed_at: new Date().toISOString() })
          .eq("id", existing.id);

        return NextResponse.json({
          success: true,
          message: "Welcome back! You've been resubscribed.",
        });
      }

      return NextResponse.json({
        success: true,
        message: "You're already subscribed!",
        alreadySubscribed: true,
      });
    }

    // Insert new subscriber
    const { error: insertError } = await supabase
      .from("newsletter_subscribers")
      .insert({
        store_id: storeId,
        email: normalizedEmail,
      });

    if (insertError) {
      console.error("Failed to save subscriber:", insertError);
      return NextResponse.json(
        { error: "Failed to subscribe. Please try again." },
        { status: 500 }
      );
    }

    // Send welcome email
    await sendNewsletterWelcome(normalizedEmail);

    console.log("Newsletter subscription:", normalizedEmail);

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed to our newsletter!",
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
}
