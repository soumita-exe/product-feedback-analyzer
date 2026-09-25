/**
 * validateAnalysis.js — strict validation + normalization of AI output.
 *
 * The AI can return malformed JSON, missing fields, or junk values.
 * Nothing reaches the frontend unless it passes through here first.
 * Returns a NEW normalized object; never mutates or trusts the input.
 */

const SENTIMENT_KEYS = ["positive", "neutral", "negative"];
const LIST_KEYS = ["themes", "complaints", "featureRequests", "improvements"];
const MAX_LIST_ITEMS = 8;
const MAX_ITEM_LENGTH = 240;
const MAX_SUMMARY_LENGTH = 1200;

/** True only for non-null values that are actual strings. */
export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/** Coerce a value to a finite number, or null if not numeric. */
function toFiniteNumber(value) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Clamp helper. */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Clean a list field: keep only non-empty strings, trim each one,
 * cap count and length. Returns null if nothing usable remains.
 */
function cleanList(value) {
  if (!Array.isArray(value)) return null;

  const items = value
    .map((item) => (isNonEmptyString(item) ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS)
    .map((item) => item.slice(0, MAX_ITEM_LENGTH));

  return items.length > 0 ? items : null;
}

/**
 * Normalize sentiment to whole numbers that total exactly 100.
 * Throws a descriptive error when the input can't be salvaged.
 */
function normalizeSentiment(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("AI response validation failed: sentiment is missing or malformed.");
  }

  const numbers = {};
  for (const key of SENTIMENT_KEYS) {
    const num = toFiniteNumber(raw[key]);
    if (num === null || num < 0) {
      throw new Error(
        `AI response validation failed: sentiment.${key} is not a valid non-negative number.`
      );
    }
    numbers[key] = num;
  }

  const total = numbers.positive + numbers.neutral + numbers.negative;
  if (total <= 0) {
    throw new Error(
      "AI response validation failed: sentiment percentages add up to zero."
    );
  }

  const rounded = {};
  for (const key of SENTIMENT_KEYS) rounded[key] = Math.floor(numbers[key]);

  let remainder = 100 - (rounded.positive + rounded.neutral + rounded.negative);
  const byFraction = SENTIMENT_KEYS.slice().sort(
    (a, b) => (numbers[b] % 1) - (numbers[a] % 1)
  );
  for (const key of byFraction) {
    if (remainder <= 0) break;
    rounded[key] += 1;
    remainder -= 1;
  }

  return rounded;
}

/**
 * Validate and normalize a parsed AI analysis object.
 * @param {unknown} parsed - the JSON-parsed AI response
 * @returns {object} normalized analysis safe for the frontend
 * @throws {Error} with a clear message when the response is unusable
 */
export function validateAnalysis(parsed) {
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AI response validation failed: response is not a JSON object.");
  }

  const summaryRaw = isNonEmptyString(parsed.summary)
    ? parsed.summary.trim()
    : null;
  if (!summaryRaw) {
    throw new Error("AI response validation failed: summary is missing or empty.");
  }

  const sentiment = normalizeSentiment(parsed.sentiment);

  const lists = {};
  for (const key of LIST_KEYS) {
    const cleaned = cleanList(parsed[key]);
    if (cleaned === null) {
      throw new Error(
        `AI response validation failed: ${key} is missing, empty, or contains no usable strings.`
      );
    }
    lists[key] = cleaned;
  }

  // Overall sentiment = largest share (ties favor negative → neutral → …).
  const { positive, neutral, negative } = sentiment;
  const overallSentiment =
    negative >= positive && negative >= neutral
      ? "negative"
      : positive >= neutral
        ? "positive"
        : "neutral";

  return {
    summary: summaryRaw.slice(0, MAX_SUMMARY_LENGTH),
    overallSentiment,
    sentiment,
    themes: lists.themes,
    complaints: lists.complaints,
    featureRequests: lists.featureRequests,
    improvements: lists.improvements,
  };
}
