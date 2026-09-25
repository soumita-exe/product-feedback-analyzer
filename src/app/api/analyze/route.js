import { NextResponse } from "next/server";
import { analyzeReviews } from "@/lib/localAnalyzer";
import { analyzeWithAi, isAiConfigured } from "@/lib/aiProvider";

/**
 * POST /api/analyze — the app's single backend endpoint.
 *
 * Mode selection:
 *   - GEMINI_API_KEY set  → analyze with Gemini (demoMode: false).
 *     If the AI call fails, return a clear error — NEVER fall back
 *     silently, so live failures are always visible.
 *   - No key configured   → use the deterministic local analyzer
 *     (demoMode: true), so the app always works.
 *
 * No database, no storage: everything is computed in memory and returned.
 */

const MAX_REVIEWS = 200;
const MAX_CHARS = 30_000;

/** Coerce the request body into a clean array of review strings. */
function extractReviews(body) {
  if (body === null || typeof body !== "object") return null;

  if (Array.isArray(body.reviews)) {
    return body.reviews.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof body.reviews === "string") {
    return String(body.reviews)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return null;
}

/** Uniform JSON error response with a human-friendly message. */
function validationError(message, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return validationError(
      "Invalid request: expected a JSON body like { \"reviews\": \"...\" }."
    );
  }

  const reviews = extractReviews(body);

  if (reviews === null) {
    return validationError(
      "Invalid request: expected a JSON body like { \"reviews\": \"...\" }."
    );
  }

  if (reviews.length === 0) {
    return validationError(
      "No reviews found. Paste at least one review (one per line) before analyzing."
    );
  }

  if (reviews.length > MAX_REVIEWS) {
    return validationError(
      `Too many reviews: ${reviews.length} received, maximum is ${MAX_REVIEWS}.`
    );
  }

  const totalChars = reviews.join("\n").length;
  if (totalChars > MAX_CHARS) {
    return validationError(
      `Reviews are too long: ${totalChars.toLocaleString("en-US")} characters, ` +
        `maximum is ${MAX_CHARS.toLocaleString("en-US")}.`
    );
  }

  // ── Live mode: Gemini is configured ──────────────────────────
  if (isAiConfigured()) {
    try {
      const analysis = await analyzeWithAi(reviews);

      return NextResponse.json({
        ok: true,
        data: {
          ...analysis,
          demoMode: false,
          reviewCount: reviews.length,
        },
      });
    } catch (error) {
      console.error("AI analysis failed:", error?.message);
      return NextResponse.json(
        {
          ok: false,
          error:
            error?.message ||
            "The AI analysis failed unexpectedly. Please try again.",
        },
        { status: 502 }
      );
    }
  }

  // ── Demo mode: no API key configured ─────────────────────────
  const analysis = analyzeReviews(reviews);

  return NextResponse.json({
    ok: true,
    data: {
      ...analysis,
      demoMode: true,
      reviewCount: reviews.length,
    },
  });
}
