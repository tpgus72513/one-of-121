"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../types";
import { DECK_SIZE, DURATION_SEC, makeDeck, type Message } from "./deck";
import SwipeCard from "./SwipeCard";

// 담당: A · 인공지능사이버보안학과 — 피싱 판별 (기획서 6장)
//
// 파일 나눔
//   messages.json  문자 데이터 (문제 내용)
//   deck.ts        규칙 숫자 + 카드 10장 뽑기
//   SwipeCard.tsx  카드 한 장 + 좌우로 끄는 기능
//   index.tsx      게임 진행 (시작 → 플레이 → 해설 → onFinish)  ← 이 파일
//
// 화면은 phase 값 하나로 바꾼다:  "ready"(시작) → "playing"(플레이) → "review"(해설)

type Phase = "ready" | "playing" | "review";
type Feedback = { correct: boolean; text: string };

export default function PhishingGame({ onFinish }: GameProps) {
  // ── ① 상태(state): 바뀌면 화면이 다시 그려지는 값들 ──────────────────
  const [phase, setPhase] = useState<Phase>("ready");
  const [deck, setDeck] = useState<Message[]>([]); // 이번 판 카드 10장
  const [index, setIndex] = useState(0); // 지금 보고 있는 카드 번호
  const [correctIds, setCorrectIds] = useState<string[]>([]); // 맞힌 카드 id
  const [answeredCount, setAnsweredCount] = useState(0); // 답한 카드 수
  const [timeLeft, setTimeLeft] = useState(DURATION_SEC);
  const [feedback, setFeedback] = useState<Feedback | null>(null); // "정답!" 같은 잠깐 뜨는 표시
  // onFinish 를 두 번 부르지 않도록 기억. 화면과 상관없어서 ref.
  const finished = useRef(false);

  const card = deck[index];

  // ── ② 시작 / 답하기 ──────────────────────────────────────────────
  function start() {
    setDeck(makeDeck());
    setIndex(0);
    setCorrectIds([]);
    setAnsweredCount(0);
    setTimeLeft(DURATION_SEC);
    setPhase("playing");
  }

  // 스와이프·버튼·키보드가 전부 이 함수 하나를 부른다
  function answer(saysPhishing: boolean) {
    if (phase !== "playing" || !card) return;

    const correct = saysPhishing === card.phishing;
    if (correct) setCorrectIds((prev) => [...prev, card.id]);
    setAnsweredCount((n) => n + 1);
    setFeedback({
      correct,
      text: correct ? "정답!" : card.phishing ? "피싱이었어요" : "진짜 문자였어요",
    });

    const isLastCard = index + 1 >= deck.length;
    if (isLastCard) setPhase("review");
    else setIndex(index + 1);
  }

  // ── ③ useEffect: 화면 밖의 일(타이머·키보드)을 붙였다 떼기 ──────────
  // 공통 모양: 시작하는 코드 → return 으로 "정리하는 코드". 정리 안 하면 타이머가 계속 돈다.

  // 1초마다 timeLeft 를 1씩 줄이고, 0이 되면 해설 화면으로
  useEffect(() => {
    if (phase !== "playing") return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setPhase("review");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // "정답!" 표시는 0.7초 뒤에 지운다
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 700);
    return () => clearTimeout(timer);
  }, [feedback]);

  // 키보드 ← 피싱, → 진짜
  useEffect(() => {
    if (phase !== "playing") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") answer(true);
      if (e.key === "ArrowRight") answer(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ── ④ 점수 계산과 onFinish ─────────────────────────────────────────
  // 점수는 state로 따로 들고 있지 않고, 맞힌 개수로 그때그때 계산한다 (값이 어긋날 일이 없다)
  // 시간이 끝나서 못 푼 카드는 자연스럽게 오답이 된다.
  const isCorrect = (m: Message) => correctIds.includes(m.id);
  const score = deck.length ? Math.round((correctIds.length / deck.length) * 100) : 0;
  const wrongCards = deck.filter((m) => !isCorrect(m));

  function finish() {
    if (finished.current) return;
    finished.current = true;

    const aiPhishing = deck.filter((m) => m.phishing && m.ai);
    // 게임 공통 규칙(types.ts): 끝나면 onFinish(점수, 세부기록) 딱 한 번
    onFinish(score, {
      correct: correctIds.length,
      total: deck.length,
      answered: answeredCount,
      timeLeft,
      aiPhishingCaught: aiPhishing.filter(isCorrect).length,
      aiPhishingTotal: aiPhishing.length,
      wrongIds: wrongCards.map((m) => m.id),
    });
  }

  // ── ⑤ 화면: phase 에 따라 셋 중 하나를 그린다 ─────────────────────────

  // [시작 화면]
  if (phase === "ready") {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-5 p-6 text-center">
        <h2 className="text-xl font-bold">🔐 피싱 문자를 가려내라</h2>
        <p className="text-sm leading-relaxed opacity-80">
          문자 {DECK_SIZE}통이 옵니다. {DURATION_SEC}초 안에 판별하세요.
          <br />
          <b>← 왼쪽 = 피싱</b> · <b>오른쪽 → = 진짜</b>
          <br />
          🤖 AI가 쓴 그럴듯한 피싱도 섞여 있어요.
        </p>
        <button
          className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white"
          onClick={start}
        >
          시작
        </button>
      </div>
    );
  }

  // [해설 화면] 틀린 카드만 보여주고, [결과 보기]를 누르면 onFinish
  if (phase === "review") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4 p-6">
        <h2 className="text-center text-xl font-bold">
          {correctIds.length} / {deck.length} 정답 · {score}점
        </h2>
        {wrongCards.length > 0 && (
          <ul className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto">
            {wrongCards.map((m) => (
              <li key={m.id} className="rounded-xl bg-neutral-100 p-3 text-sm text-neutral-900">
                <p className="mb-1 font-semibold">
                  {m.phishing ? "🚨 피싱" : "✅ 진짜"} · {m.sender}
                </p>
                <p className="mb-2 line-clamp-2 opacity-70">{m.body}</p>
                <p>{m.explain}</p>
              </li>
            ))}
          </ul>
        )}
        <button
          className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white"
          onClick={finish}
        >
          결과 보기
        </button>
      </div>
    );
  }

  // [플레이 화면]
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 p-4 select-none">
      {/* 위: 진행도 · 남은 시간 */}
      <div className="flex w-full justify-between text-sm font-semibold">
        <span>
          {index + 1} / {deck.length}
        </span>
        <span className={timeLeft <= 10 ? "text-red-500" : ""}>⏱ {timeLeft}초</span>
      </div>

      {/* 가운데: 카드. key 가 바뀌면 React가 새 카드로 갈아끼워서, 끌던 위치가 초기화된다 */}
      <div className="relative h-72 w-full">
        <SwipeCard key={card.id} message={card} onSwipe={answer} />

        {feedback && (
          <div
            className={`pointer-events-none absolute inset-x-0 -bottom-2 mx-auto w-fit rounded-full px-4 py-1 text-sm font-bold text-white ${
              feedback.correct ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {feedback.text}
          </div>
        )}
      </div>

      {/* 아래: 스와이프가 어려운 사람용 버튼 */}
      <div className="flex w-full gap-3">
        <button
          className="flex-1 rounded-xl bg-red-500 py-3 font-semibold text-white"
          onClick={() => answer(true)}
        >
          ← 피싱
        </button>
        <button
          className="flex-1 rounded-xl bg-green-500 py-3 font-semibold text-white"
          onClick={() => answer(false)}
        >
          진짜 →
        </button>
      </div>
    </div>
  );
}
