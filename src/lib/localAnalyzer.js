/**
 * localAnalyzer.js — demo/fallback analyzer (no AI, no network).
 *
 * Runs entirely on the server and produces the SAME analysis shape the
 * AI provider will return in Stage 3, so the frontend never needs to know
 * which mode produced the results.
 *
 * How it works (deterministic, beginner-friendly heuristics):
 *   1. Split the pasted text into individual reviews (one per line).
 *   2. Score each review with small positive/negative keyword lists.
 *   3. Bucket reviews into known topics (battery, app, price, …).
 *   4. Derive themes, complaints, feature requests and improvements
 *      from those buckets, always in the same order (no randomness).
 */

/* ── Keyword dictionaries ──────────────────────────────────────────── */

const POSITIVE_WORDS = [
  "love", "great", "excellent", "amazing", "awesome", "perfect", "best",
  "good", "fantastic", "wonderful", "happy", "satisfied", "recommend",
  "comfortable", "easy", "fast", "premium", "value", "reliable", "solid",
  "works", "working", "impressed", "enjoy", "enjoyed", "smooth", "sturdy",
  "affordable", "worth", "flawless", "responsive", "durable", "convenient",
  "nice", "beautiful", "helpful", "pleased", "delighted", "five stars",
];

const NEGATIVE_WORDS = [
  "disappointing", "disappointed", "bad", "terrible", "awful", "worst",
  "hate", "broken", "broke", "crash", "crashing", "crashes", "bug", "buggy",
  "slow", "useless", "cheap", "poor", "problem", "problems", "issue",
  "issues", "fail", "failed", "failure", "bricked", "rattling", "cracked",
  "confusing", "clunky", "overpriced", "annoying", "frustrating", "waste",
  "defective", "faulty", "flimsy", "unusable", "unreliable", "refund",
  "return it", "returned it", "regret", "junk", "garbage", "horrible",
  "pathetic", "mediocre", "flaw", "flaws", "defect", "defects",
];

/**
 * Strong phrases carry extra weight: a single clearly-worded complaint or
 * compliment should outweigh a couple of weak keywords.
 */
const STRONG_POSITIVE_PHRASES = [
  "works perfectly", "working perfectly", "absolutely love", "really love",
  "highly recommend", "best purchase", "exceeded my expectations",
  "beyond expectations", "couldn't be happier", "top notch", "worth every penny",
];

const STRONG_NEGATIVE_PHRASES = [
  "terrible", "awful", "very disappointed", "really disappointed",
  "hate", "worst", "poor quality", "bad quality", "doesn't work",
  "does not work", "didn't work", "did not work", "completely broken",
  "totally broken", "stopped working", "never works", "waste of money",
  "complete waste", "do not buy", "don't buy", "never again",
  "would not recommend", "wouldn't recommend", "fell apart",
];

/**
 * Negation words: when one appears shortly BEFORE a sentiment word,
 * that word's polarity flips ("not good" → negative).
 */
const NEGATORS = [
  "not", "never", "no", "hardly", "barely", "isn't", "wasn't", "aren't",
  "weren't", "don't", "doesn't", "didn't", "won't", "cannot", "can't",
  "couldn't", "wouldn't", "ain't",
];

/** How far back (in words) a negator still counts as flipping a word. */
const NEGATION_WINDOW = 3;

/**
 * Topics we can detect, each with the keywords that map a review to it.
 * Order matters only for display stability; counts drive ranking.
 */
const TOPICS = [
  {
    label: "Battery life",
    keywords: ["battery", "charge", "charging", "hours"],
    complaint: "Battery life falls short of what was promised",
    improvement: "Increase real-world battery life and publish honest estimates",
  },
  {
    label: "App experience",
    keywords: ["app", "crash", "crashing", "bug", "equalizer", "firmware", "update", "ui"],
    complaint: "The companion app is unstable or confusing",
    improvement: "Fix app crashes and simplify the interface (equalizer, presets)",
  },
  {
    label: "Sound quality",
    keywords: ["sound", "audio", "bass", "quality"],
    complaint: "Sound quality does not match the price",
    improvement: "Tune the sound profile, especially bass response",
  },
  {
    label: "Price & value",
    keywords: ["price", "overpriced", "value", "expensive", "cost"],
    complaint: "The product feels overpriced for what it offers",
    improvement: "Revisit pricing or bundle more value into the current price",
  },
  {
    label: "Shipping & packaging",
    keywords: ["shipping", "delivery", "packaging", "arrived", "case"],
    complaint: "Shipping and arrival condition issues",
    improvement: "Improve packaging and quality control before shipping",
  },
  {
    label: "Customer support",
    keywords: ["support", "service", "reply", "response", "replaced"],
    complaint: "Customer support is slow or unhelpful",
    improvement: "Speed up support responses and empower first-contact fixes",
  },
  {
    label: "Build quality",
    keywords: ["build", "quality", "noise", "rattling", "cracked", "control"],
    complaint: "Build quality and quality control concerns",
    improvement: "Strengthen build quality checks to catch defects early",
  },
  {
    label: "Comfort & fit",
    keywords: ["comfortable", "comfort", "fit", "wear", "ear tips"],
    complaint: "Comfort or fit could be better",
    improvement: "Offer more ear-tip sizes and refine long-wear comfort",
  },
  {
    label: "Setup & pairing",
    keywords: ["setup", "pairing", "pair", "connect", "manual"],
    complaint: "Setup and pairing are confusing",
    improvement: "Streamline first-time setup with clearer instructions",
  },
];

/** Phrases that usually signal a feature request. */
const REQUEST_PHRASES = [
  "wish", "would love", "please add", "add ", "should have",
  "needs", "missing", "want", "hope", "suggest",
];

/* ── Small helpers ─────────────────────────────────────────────────── */

/** Split raw text into a clean array of reviews (one per non-empty line). */
function splitReviews(text) {
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Lowercase contains-check on a single word or phrase. */
function mentions(lowercased, word) {
  return lowercased.includes(word);
}

/** All topics whose keywords appear in the review. */
function topicsInReview(lowercased) {
  return TOPICS.filter((topic) =>
    topic.keywords.some((keyword) => mentions(lowercased, keyword))
  );
}

/**
 * Classify one review: "positive" | "negative" | "neutral".
 * Net score = positive hits − negative hits; 0 means neutral.
 */
function classifyReview(lowercased) {
  let score = 0;

  // Strong phrases carry double weight; they describe unmistakable sentiment.
  // A negator in front softens the phrase instead ("not terrible" ≠ negative).
  for (const phrase of STRONG_POSITIVE_PHRASES) {
    if (!mentions(lowercased, phrase)) continue;
    score += isNegated(lowercased, phrase) ? 1 : 2;
  }
  for (const phrase of STRONG_NEGATIVE_PHRASES) {
    if (!mentions(lowercased, phrase)) continue;
    score -= isNegated(lowercased, phrase) ? 1 : 2;
  }

  // Single words carry one point; negation within the window flips polarity.
  for (const word of POSITIVE_WORDS) {
    if (isNegated(lowercased, word)) {
      score -= 1;
    } else if (mentions(lowercased, word)) {
      score += 1;
    }
  }
  for (const word of NEGATIVE_WORDS) {
    if (isNegated(lowercased, word)) {
      score += 1;
    } else if (mentions(lowercased, word)) {
      score -= 1;
    }
  }

  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}

/**
 * True when `word` appears in `text` AND a negator sits within
 * NEGATION_WINDOW words before it ("not good" → negated "good").
 */
function isNegated(text, word) {
  let searchFrom = 0;

  for (;;) {
    const index = text.indexOf(word, searchFrom);
    if (index === -1) return false;

    const before = text.slice(Math.max(0, index - 40), index);
    const wordsBefore = before
      .split(/[\s,.!?;:]+/)
      .filter(Boolean)
      .slice(-NEGATION_WINDOW);

    if (wordsBefore.some((w) => NEGATORS.includes(w))) return true;
    searchFrom = index + word.length;
  }
}

/** Does the review read like a feature request? */
function looksLikeFeatureRequest(lowercased) {
  return REQUEST_PHRASES.some((phrase) => mentions(lowercased, phrase));
}

/** Truncate long text for list display. */
function truncate(text, maxLength = 90) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

/**
 * Round three percentages so they always add up to exactly 100
 * (largest-remainder method — deterministic, no floating-point drift).
 */
function percentSplit(counts) {
  const total = counts.positive + counts.neutral + counts.negative;
  const raw = {
    positive: (counts.positive / total) * 100,
    neutral: (counts.neutral / total) * 100,
    negative: (counts.negative / total) * 100,
  };
  const rounded = {
    positive: Math.floor(raw.positive),
    neutral: Math.floor(raw.neutral),
    negative: Math.floor(raw.negative),
  };
  let remainder = 100 - (rounded.positive + rounded.neutral + rounded.negative);

  // Give leftover points to the largest fractional parts first.
  const byFraction = Object.keys(raw).sort(
    (a, b) => (raw[b] % 1) - (raw[a] % 1)
  );
  for (const key of byFraction) {
    if (remainder <= 0) break;
    rounded[key] += 1;
    remainder -= 1;
  }
  return rounded;
}

/** Tally helper: increments a Map counter and returns ranked entries. */
function rankedTally(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

/* ── Main entry point ──────────────────────────────────────────────── */

/**
 * Analyze an array of review strings locally.
 * Returns the full analysis object used by the dashboard.
 */
export function analyzeReviews(reviews) {
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  const themeTally = new Map();        // topic label → mention count
  const complaintTally = new Map();    // topic label → negative-review count
  const requestTally = new Map();      // request label → mention count
  const improvementTally = new Map();  // suggestion → priority score

  for (const review of reviews) {
    const text = review.toLowerCase();
    const sentiment = classifyReview(text);
    sentimentCounts[sentiment] += 1;

    const topics = topicsInReview(text);

    // Themes: every detected topic counts as a mention.
    for (const topic of topics) {
      themeTally.set(topic.label, (themeTally.get(topic.label) || 0) + 1);
    }

    // Complaints: topics from reviews that scored negative.
    if (sentiment === "negative") {
      for (const topic of topics) {
        complaintTally.set(topic.label, (complaintTally.get(topic.label) || 0) + 1);
        improvementTally.set(
          topic.improvement,
          (improvementTally.get(topic.improvement) || 0) + 2
        );
      }
    }

    // Feature requests: request-shaped reviews, labeled by topic when possible.
    if (looksLikeFeatureRequest(text)) {
      const label = topics.length > 0 ? topics[0].label : truncate(review, 60);
      requestTally.set(label, (requestTally.get(label) || 0) + 1);
      if (topics.length > 0) {
        improvementTally.set(
          topics[0].improvement,
          (improvementTally.get(topics[0].improvement) || 0) + 1
        );
      }
    }
  }

  const sentiment = percentSplit(sentimentCounts);

  // Overall sentiment = the largest bucket (ties favor negative > neutral).
  const overallSentiment =
    sentiment.negative >= sentiment.positive &&
    sentiment.negative >= sentiment.neutral
      ? "negative"
      : sentiment.positive >= sentiment.neutral
        ? "positive"
        : "neutral";

  const themes = rankedTally(themeTally).map(([label, count]) => `${label} (${count})`);
  const complaints = rankedTally(complaintTally)
    .slice(0, 5)
    .map(([label, count]) => `${label} — ${count} ${count === 1 ? "review" : "reviews"}`);
  const featureRequests = rankedTally(requestTally)
    .slice(0, 5)
    .map(([label, count]) => `${label} (${count} ${count === 1 ? "request" : "requests"})`);
  const improvements = rankedTally(improvementTally)
    .slice(0, 4)
    .map(([suggestion]) => suggestion);

  const topTheme = themes.length > 0 ? themes[0].replace(/\s\(\d+\)$/, "") : "general feedback";

  const summary =
    `Across ${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}: ` +
    `${sentiment.positive}% positive, ${sentiment.neutral}% neutral, ` +
    `${sentiment.negative}% negative — overall sentiment is ${overallSentiment}. ` +
    `The most discussed theme is ${topTheme}.` +
    (complaints.length > 0 ? ` Top complaint: ${complaints[0].toLowerCase()}.` : "");

  return {
    summary,
    overallSentiment,
    sentiment,
    themes: themes.length > 0 ? themes.slice(0, 6) : ["General feedback"],
    complaints,
    featureRequests,
    improvements:
      improvements.length > 0
        ? improvements
        : ["Keep monitoring feedback — no clear improvement pattern yet"],
    demoMode: true,
  };
}
