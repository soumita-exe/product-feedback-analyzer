/**
 * prompt.js — builds the instruction prompt sent to the AI provider.
 *
 * The prompt demands JSON-only output with an exact schema so the
 * response can be strictly validated before it ever reaches the UI.
 */

/**
 * Build the full analysis prompt for a list of review strings.
 * @param {string[]} reviews - clean, non-empty review strings
 * @returns {string} the prompt text
 */
export function buildAnalysisPrompt(reviews) {
  const numberedReviews = reviews.map((r, i) => `${i + 1}. ${r}`).join("\n");

  return `You are a senior product analyst. Analyze the following customer reviews of a product and produce structured, actionable insights for a product team.

CUSTOMER REVIEWS:
${numberedReviews}

ANALYSIS RULES:
1. Sentiment: classify each review as positive, neutral, or negative, then report the percentage of reviews in each category. The three percentages MUST be whole numbers that add up to exactly 100.
2. Themes: the main topics discussed across reviews (most mentioned first). Each theme: a short label (2-5 words) with its mention count in parentheses, e.g. "Battery life (4)".
3. Complaints: the most common problems customers report (most frequent first). Each complaint: one concise sentence.
4. Feature requests: features customers explicitly ask for (most requested first). Each request: one concise sentence.
5. Improvements: concrete, prioritized actions the product team should take, derived from the complaints and requests. Each improvement: one actionable sentence.
6. Summary: 2-3 sentences covering overall sentiment, the most discussed theme, and the single most important takeaway for the product team.
7. Base every statement ONLY on what the reviews actually say. Do not invent facts.
8. Every list must contain 1 to 6 short string items. Use plain text (no markdown).

Respond with VALID JSON ONLY — no markdown, no code fences, no explanations before or after. Use exactly this shape:
{
  "summary": "string",
  "sentiment": { "positive": 0, "neutral": 0, "negative": 0 },
  "themes": ["string", "..."],
  "complaints": ["string", "..."],
  "featureRequests": ["string", "..."],
  "improvements": ["string", "..."]
}`;
}
