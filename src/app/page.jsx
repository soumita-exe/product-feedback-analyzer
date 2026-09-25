"use client";

import { useState } from "react";
import ReviewInput from "@/components/ReviewInput";
import EmptyState from "@/components/states/EmptyState";
import LoadingState from "@/components/states/LoadingState";
import ErrorState from "@/components/states/ErrorState";
import ResultsDashboard from "@/components/ResultsDashboard";
import { DEMO_REVIEWS } from "@/lib/demoReviews";

/**
 * The main page owns all application state and passes data + callbacks down.
 * Status flow: "idle" → "loading" → "done" | "error".
 */
export default function HomePage() {
  const [reviewText, setReviewText] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  function handleLoadDemo() {
    setReviewText(DEMO_REVIEWS);
    setStatus("idle");
    setResult(null);
    setErrorMessage("");
  }

  function handleReset() {
    setReviewText("");
    setStatus("idle");
    setResult(null);
    setErrorMessage("");
  }

  async function handleAnalyze() {
    setStatus("loading");
    setErrorMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews: reviewText }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Analysis failed. Please try again.");
      }

      setResult(payload.data);
      setStatus("done");
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : "Something went wrong. Please try again."
      );
      setStatus("error");
    }
  }

  return (
    <div className="home-layout">
      <section className="panel">
        <ReviewInput
          value={reviewText}
          onChange={setReviewText}
          onAnalyze={handleAnalyze}
          onLoadDemo={handleLoadDemo}
          onReset={handleReset}
          disabled={status === "loading"}
          hasAnythingToClear={
            reviewText.length > 0 || result !== null || errorMessage !== ""
          }
        />
      </section>

      <section className="results-area">
        {status === "idle" && <EmptyState />}
        {status === "loading" && <LoadingState />}
        {status === "error" && (
          <ErrorState message={errorMessage} onRetry={handleAnalyze} />
        )}
        {status === "done" && result && (
          <ResultsDashboard result={result} reviewCount={result.reviewCount} />
        )}
      </section>
    </div>
  );
}
