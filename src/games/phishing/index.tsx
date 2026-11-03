"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { GameProps } from "../types";
import allMessages from "./messages.json";

// 담당: A · 인공지능사이버보안학과 — 피싱 판별 (기획서 6장)
// 문자 카드를 왼쪽(피싱) / 오른쪽(진짜)으로 스와이프한다. 마우스·터치·키보드(←/→) 모두 된다.

type Message = (typeof allMessages)[number];
type Answer = { id: string; correct: boolean };

const DURATION_SEC = 45; // registry.ts 의 durationSec 과 맞춘다
const DECK_SIZE = 10;
const SWIPE_THRESHOLD = 100; // 이만큼(px) 끌어야 답으로 인정

// 피싱 6장 + 진짜 4장을 섞어서 뽑는다. (AI가 쓴 피싱이 꼭 들어가도록 피싱을 조금 더)
function makeDeck(): Message[] {
  const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
  const phishing = shuffle(allMessages.filter((m) => m.phishing)).slice(0, 6);
  const real = shuffle(allMessages.filter((m) => !m.phishing)).slice(0, DECK_SIZE - 6);
  return shuffle([...phishing, ...real]);
}

export default function PhishingGame({ onFinish }: GameProps) {
  const [phase, setPhase] = useState<"ready" | "playing" | "review">("ready");
  const [deck, setDeck] = useState<Message[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(DURATION_SEC);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flash, setFlash] = useState<{ correct: boolean; text: string } | null>(null);
  const dragStartX = useRef<number | null>(null);
  const finished = useRef(false);

  const card = deck[index];

  function start() {
    setDeck(makeDeck());
    setIndex(0);
    setAnswers([]);
    setTimeLeft(DURATION_SEC);
    setPhase("playing");
  }

  function answer(saysPhishing: boolean) {
    if (phase !== "playing" || !card) return;
    const correct = saysPhishing === card.phishing;
    setAnswers((prev) => [...prev, { id: card.id, correct }]);
    setFlash({
      correct,
      text: correct ? "정답!" : card.phishing ? "피싱이었어요" : "진짜 문자였어요",
    });
    setDragX(0);
    if (index + 1 >= deck.length) setPhase("review");
    else setIndex(index + 1);
  }

  // 제한시간
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

  // 정답/오답 표시는 잠깐만
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 700);
    return () => clearTimeout(t);
  }, [flash]);

  // 키보드: ← 피싱, → 진짜
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") answer(true);
      if (e.key === "ArrowRight") answer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // 스와이프 (pointer 이벤트 하나로 마우스·터치 둘 다 처리)
  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    dragStartX.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (dragStartX.current === null) return;
    setDragX(e.clientX - dragStartX.current);
  }
  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (dragStartX.current === null) return; // pointerup 뒤에 lostpointercapture 가 또 오므로 한 번만
    // state(dragX)는 빠르게 놓으면 아직 갱신 전일 수 있어서, 이벤트 좌표로 다시 계산한다
    const dx = e.clientX - dragStartX.current;
    dragStartX.current = null;
    setDragging(false);
    if (dx <= -SWIPE_THRESHOLD) answer(true);
    else if (dx >= SWIPE_THRESHOLD) answer(false);
    else setDragX(0);
  }

  // 못 푼 카드는 틀린 걸로 친다
  const correctCount = answers.filter((a) => a.correct).length;
  const score = deck.length ? Math.round((correctCount / deck.length) * 100) : 0;

  function finish() {
    if (finished.current) return;
    finished.current = true;
    const aiPhishing = deck.filter((m) => m.phishing && m.ai);
    onFinish(score, {
      correct: correctCount,
      total: deck.length,
      answered: answers.length,
      timeLeft,
      aiPhishingCaught: aiPhishing.filter((m) => answers.find((a) => a.id === m.id)?.correct)
        .length,
      aiPhishingTotal: aiPhishing.length,
      wrongIds: deck.filter((m) => !answers.find((a) => a.id === m.id)?.correct).map((m) => m.id),
    });
  }

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

  if (phase === "review") {
    const wrong = deck.filter((m) => !answers.find((a) => a.id === m.id)?.correct);
    return (
      <div className="flex w-full max-w-sm flex-col gap-4 p-6">
        <h2 className="text-center text-xl font-bold">
          {correctCount} / {deck.length} 정답 · {score}점
        </h2>
        {wrong.length > 0 && (
          <ul className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto">
            {wrong.map((m) => (
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

  const tilt = Math.max(-1, Math.min(1, dragX / SWIPE_THRESHOLD));

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 p-4 select-none">
      <div className="flex w-full justify-between text-sm font-semibold">
        <span>
          {index + 1} / {deck.length}
        </span>
        <span className={timeLeft <= 10 ? "text-red-500" : ""}>⏱ {timeLeft}초</span>
      </div>

      <div className="relative h-72 w-full">
        <div
          key={card.id}
          className="absolute inset-0 flex cursor-grab touch-pan-y flex-col gap-3 rounded-2xl bg-white p-5 text-neutral-900 shadow-lg active:cursor-grabbing"
          style={{
            transform: `translateX(${dragX}px) rotate(${tilt * 8}deg)`,
            transition: dragging ? "none" : "transform 0.2s",
            outline:
              tilt <= -0.6 ? "3px solid #ef4444" : tilt >= 0.6 ? "3px solid #22c55e" : "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onLostPointerCapture={onPointerUp}
        >
          <p className="text-xs font-semibold text-neutral-500">📩 {card.sender}</p>
          <p className="text-[15px] leading-relaxed break-all">{card.body}</p>
        </div>

        {flash && (
          <div
            className={`pointer-events-none absolute inset-x-0 -bottom-2 mx-auto w-fit rounded-full px-4 py-1 text-sm font-bold text-white ${
              flash.correct ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {flash.text}
          </div>
        )}
      </div>

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
