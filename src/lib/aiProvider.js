/**
 * aiProvider.js — server-only Gemini REST client.
 *
 * SECURITY RULES for this file:
 *   - Runs on the server exclusively (imported only by the API route).
 *   - The API key comes from process.env.GEMINI_API_KEY and is used only
 *     to build the Authorization header. It is NEVER returned, logged,
 *     or included in any response sent to the browser.
 *
 * Uses plain fetch — no SDK, no extra dependencies.
 */

import { buildAnalysisPrompt } from "./prompt";
import { validateAnalysis } from "./validateAnalysis";

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com";
const GEMINI_MODEL = "gemini-2.5-flash"; // GA, cost-conscious, fit for purpose
const TIMEOUT_MS = 30_000;

/** Read config from env (no key logging, ever). */
function getConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  const baseUrl = process.env.GEMINI_BASE_URL || DEFAULT_BASE_URL;

  if (!apiKey || apiKey.trim() === "") {
    return null; // No key configured → caller uses demo mode.
  }
  return { apiKey: apiKey.trim(), baseUrl: baseUrl.replace(/\/+$/, "") };
}

/** True when a Gemini API key is configured. */
export function isAiConfigured() {
  return getConfig() !== null;
}

/**
 * Extract the JSON payload from a model response that may wrap it in
 * markdown fences or prose, e.g. "```json\n{...}\n```" or 'Sure! {"a":1}'.
 */
function extractJsonText(rawText) {
  let text = rawText.trim();

  // Prefer ```json ... ``` blocks when present.
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // Otherwise take the widest { ... } span as the JSON candidate.
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  return text;
}

/** Map network/HTTP failures to friendly, safe error messages. */
function mapHttpError(status) {
  if (status === 400 || status === 401 || status === 403) {
    return "The AI service rejected the request (check that your GEMINI_API_KEY is valid).";
  }
  if (status === 429) {
    return "The AI service is rate-limited right now. Please wait a moment and try again.";
  }
  if (status >= 500) {
    return "The AI service had an internal error. Please try again.";
  }
  return `The AI service returned an unexpected error (HTTP ${status}).`;
}

/**
 * Call Gemini and return a validated analysis object.
 * @returns {Promise<object>} validated analysis (demoMode added by caller)
 * @throws {Error} with a user-safe message — never includes the API key
 */
export async function analyzeWithAi(reviews) {
  const config = getConfig();
  if (!config) {
    throw new Error("AI is not configured.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(
      `${config.baseUrl}/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": config.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: buildAnalysisPrompt(reviews) }],
            },
          ],
          generationConfig: {
            temperature: 0.2, // low temperature → stable, factual output
            maxOutputTokens: 1024,
            responseMimeType: "application/json", // forces valid JSON output
          },
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      // Logged without the key; body may contain provider diagnostics.
      console.error(
        `Gemini API error: HTTP ${response.status}`,
        bodyText.slice(0, 300)
      );
      throw new Error(mapHttpError(response.status));
    }

    const data = await response.json();

    const rawText =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join("") ?? "";

    if (!rawText) {
      throw new Error(
        "The AI service returned an empty response. Please try again."
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(extractJsonText(rawText));
    } catch {
      throw new Error(
        "The AI service returned malformed JSON. Please try again."
      );
    }

    return validateAnalysis(parsed);
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        "The AI service took too long to respond. Please try again."
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
