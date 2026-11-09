"use client";

import { useEffect, useState } from "react";
import type { ResultCardResponse } from "@/app/api/result-card/service";
import styles from "./microscope.module.css";

interface Props {
  score: number;
  correct: number;
  total: number;
  mistakes: number;
}

type CardState =
  { status: "loading" } | { status: "error" } | { status: "ready"; result: ResultCardResponse };

// C의 공통 결과 화면 연결 전, B의 게임에서 결과 카드 API를 확인하는 작은 미리보기.
export default function ResultCardPreview({ score, correct, total, mistakes }: Props) {
  const [state, setState] = useState<CardState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/result-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            gameDept: "food-biotech",
            gameId: "microscope",
            score,
            detail: { correct, total, mistakes },
          }),
        });
        if (!response.ok) throw new Error("card unavailable");
        const result: ResultCardResponse = await response.json();
        if (
          !result.card ||
          typeof result.card.title !== "string" ||
          typeof result.card.description !== "string" ||
          !Array.isArray(result.card.keywords) ||
          !result.card.keywords.every((keyword) => typeof keyword === "string") ||
          (result.source !== "ai" && result.source !== "fallback")
        ) {
          throw new Error("invalid card");
        }
        if (!controller.signal.aborted) setState({ status: "ready", result });
      } catch {
        if (!controller.signal.aborted) setState({ status: "error" });
      }
    }
    void load();
    return () => controller.abort();
  }, [score, correct, total, mistakes, attempt]);

  return (
    <section
      className={styles.resultCard}
      aria-label="나의 결과 카드"
      aria-busy={state.status === "loading"}
    >
      {state.status === "loading" && <p role="status">오늘의 연구원 카드를 만드는 중이에요…</p>}
      {state.status === "error" && (
        <>
          <p role="status">결과 카드를 불러오지 못했어요. 실험 기록은 아래에서 확인할 수 있어요.</p>
          <button
            type="button"
            className={styles.retryCardButton}
            onClick={() => {
              setState({ status: "loading" });
              setAttempt((current) => current + 1);
            }}
          >
            카드 다시 불러오기
          </button>
        </>
      )}
      {state.status === "ready" && (
        <>
          <span className={styles.cardSource}>
            {state.result.source === "ai" ? "AI가 만든 나의 카드" : "오늘의 기본 결과 카드"}
          </span>
          <h3>{state.result.card.title}</h3>
          <p>{state.result.card.description}</p>
          <div className={styles.cardKeywords}>
            {state.result.card.keywords.map((keyword) => (
              <span key={keyword}>#{keyword}</span>
            ))}
          </div>
          <small>오늘의 플레이를 바탕으로 만든 재미용 카드예요.</small>
        </>
      )}
    </section>
  );
}
