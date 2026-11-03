"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../types";
import { DURATION_SEC, makeDeck, type Message } from "./deck";
import ReviewScreen from "./ReviewScreen";
import StartScreen from "./StartScreen";
import SwipeCard from "./SwipeCard";

// 담당: A · 인공지능사이버보안학과 — 피싱 판별 (기획서 6장)
//
// 파일 나눔
//   messages.json     문자 데이터 (문제 내용)
//   deck.ts           규칙 숫자 + 카드 10장 뽑기
//   SwipeCard.tsx     카드 한 장 + 좌우로 끄는 기능
//   StartScreen.tsx   시작 화면
//   ReviewScreen.tsx  해설 화면 (점수 링 · 틀린 문제 해설)
//   index.tsx         게임 진행 + 플레이 화면  ← 이 파일
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
  const [streak, setStreak] = useState(0); // 지금 연속 정답 수
  const [bestStreak, setBestStreak] = useState(0); // 이번 판 최고 연속 정답
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
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(DURATION_SEC);
    setPhase("playing");
  }

  // 스와이프·버튼·키보드가 전부 이 함수 하나를 부른다
  function answer(saysPhishing: boolean) {
    if (phase !== "playing" || !card) return;

    const correct = saysPhishing === card.phishing;
    const nextStreak = correct ? streak + 1 : 0;
    if (correct) setCorrectIds((prev) => [...prev, card.id]);
    setAnsweredCount((n) => n + 1);
    setStreak(nextStreak);
    setBestStreak((best) => Math.max(best, nextStreak));
    setFeedback({
      correct,
      text: !correct
        ? card.phishing
          ? "앗, 피싱이었어요"
          : "진짜 문자였어요"
        : nextStreak >= 3
          ? `🔥 ${nextStreak}연속 정답!`
          : "정답!",
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

  // "정답!" 표시는 0.8초 뒤에 지운다
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 800);
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
  const aiPhishing = deck.filter((m) => m.phishing && m.ai);

  function finish() {
    if (finished.current) return;
    finished.current = true;

    // 게임 공통 규칙(types.ts): 끝나면 onFinish(점수, 세부기록) 딱 한 번
    onFinish(score, {
      correct: correctIds.length,
      total: deck.length,
      answered: answeredCount,
      timeLeft,
      bestStreak,
      aiPhishingCaught: aiPhishing.filter(isCorrect).length,
      aiPhishingTotal: aiPhishing.length,
      wrongIds: wrongCards.map((m) => m.id),
    });
  }

  // ── ⑤ 화면: 바깥 틀은 공통, 안쪽만 phase 에 따라 바뀐다 ─────────────────
  return (
    <div className="relative flex min-h-[600px] w-full max-w-sm flex-col overflow-hidden rounded-[2rem] bg-linear-to-b from-slate-900 via-slate-900 to-indigo-950 p-5 text-white shadow-2xl ring-1 ring-white/10 select-none">
      {/* 배경의 은은한 빛 */}
      <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-64 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative flex flex-1 flex-col">
        {phase === "ready" && <StartScreen onStart={start} />}

        {phase === "review" && (
          <ReviewScreen
            score={score}
            correct={correctIds.length}
            total={deck.length}
            bestStreak={bestStreak}
            aiCaught={aiPhishing.filter(isCorrect).length}
            aiTotal={aiPhishing.length}
            wrongCards={wrongCards}
            onDone={finish}
          />
        )}

        {phase === "playing" && card && (
          <PlayScreen
            deck={deck}
            index={index}
            correctIds={correctIds}
            timeLeft={timeLeft}
            feedback={feedback}
            onAnswer={answer}
          />
        )}
      </div>
    </div>
  );
}

// [플레이 화면] 위: 진행도·시간 / 가운데: 카드 더미 / 아래: 버튼
interface PlayScreenProps {
  deck: Message[];
  index: number;
  correctIds: string[];
  timeLeft: number;
  feedback: Feedback | null;
  onAnswer: (saysPhishing: boolean) => void;
}

function PlayScreen({ deck, index, correctIds, timeLeft, feedback, onAnswer }: PlayScreenProps) {
  const card = deck[index];
  const hurry = timeLeft <= 10;

  return (
    <div className="flex flex-1 flex-col gap-5">
      {/* 진행도: 푼 칸은 초록/빨강, 지금 칸은 흰색 */}
      <div className="flex gap-1.5">
        {deck.map((m, i) => (
          <div
            key={m.id}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < index
                ? correctIds.includes(m.id)
                  ? "bg-emerald-400"
                  : "bg-rose-400"
                : i === index
                  ? "bg-white"
                  : "bg-white/15"
            }`}
          />
        ))}
      </div>

      {/* 남은 시간: 숫자 + 줄어드는 막대 */}
      <div className="flex items-center gap-3">
        <span
          className={`w-14 text-right font-mono text-lg font-bold tabular-nums ${hurry ? "animate-pulse text-rose-400" : ""}`}
        >
          {timeLeft}s
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
              hurry ? "bg-rose-400" : "bg-linear-to-r from-cyan-400 to-indigo-400"
            }`}
            style={{ width: `${(timeLeft / DURATION_SEC) * 100}%` }}
          />
        </div>
        <span className="text-sm text-slate-400">
          {index + 1}/{deck.length}
        </span>
      </div>

      {/* 카드 더미: 뒤에 다음 카드 두 장이 살짝 비쳐 보인다 */}
      <div className="relative flex-1">
        {deck[index + 2] && (
          <div className="absolute inset-0 translate-y-6 scale-[0.88] rounded-3xl bg-white/30" />
        )}
        {deck[index + 1] && (
          <div className="absolute inset-0 translate-y-3 scale-[0.94] rounded-3xl bg-white/60" />
        )}
        {/* key 가 바뀌면 React가 새 카드로 갈아끼워서, 끌던 위치가 초기화된다 */}
        <SwipeCard key={card.id} message={card} onSwipe={onAnswer} />
      </div>

      {/* 정답/오답 알림 */}
      <div className="flex h-9 items-center justify-center">
        {feedback && (
          <div
            className={`rounded-full px-5 py-1.5 text-sm font-black shadow-lg ${
              feedback.correct ? "bg-emerald-400 text-emerald-950" : "bg-rose-500 text-white"
            }`}
          >
            {feedback.text}
          </div>
        )}
      </div>

      {/* 스와이프가 어려운 사람용 버튼 */}
      <div className="flex justify-center gap-10">
        <AnswerButton label="피싱" emoji="🚨" tone="rose" onClick={() => onAnswer(true)} />
        <AnswerButton label="안전" emoji="✅" tone="emerald" onClick={() => onAnswer(false)} />
      </div>
    </div>
  );
}

function AnswerButton(props: {
  label: string;
  emoji: string;
  tone: "rose" | "emerald";
  onClick: () => void;
}) {
  const ring =
    props.tone === "rose"
      ? "ring-rose-400/60 bg-rose-500/15 shadow-[0_0_25px_rgba(244,63,94,0.35)]"
      : "ring-emerald-400/60 bg-emerald-500/15 shadow-[0_0_25px_rgba(16,185,129,0.35)]";
  return (
    <button className="flex flex-col items-center gap-1.5" onClick={props.onClick}>
      <span
        className={`flex size-16 items-center justify-center rounded-full text-2xl ring-2 transition active:scale-90 ${ring}`}
      >
        {props.emoji}
      </span>
      <span className="text-xs font-bold text-slate-300">{props.label}</span>
    </button>
  );
}
