import { NextResponse } from "next/server";
import { getFeaturedReviews } from "@/lib/reviews";

// GET - Fetch featured reviews for testimonials section
export async function GET() {
  try {
    const reviews = await getFeaturedReviews();
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error fetching featured reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews", reviews: [] },
      { status: 500 }
    );
  }
}
