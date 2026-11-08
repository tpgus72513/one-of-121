"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../types";
import { DURATION_SEC, makeDeck, type Message } from "./deck";
import { reaction } from "./lines";
import ReviewScreen from "./ReviewScreen";
import StartScreen from "./StartScreen";
import SwipeCard from "./SwipeCard";
import { display, pressable, sticker } from "./theme";

// 담당: A · 인공지능사이버보안학과 — 피싱 판별 (기획서 6장)
//
// 파일 나눔
//   messages.json     문자 데이터 (일반 피싱 + 세종캠 이야기, 선배 해설)
//   deck.ts           규칙 숫자 + 카드 뽑기 (최근 본 문자는 뒤로)
//   lines.ts          답할 때 한마디, 끝나고 받는 칭호
//   theme.ts          글꼴, 스티커 테두리 모양
//   SwipeCard.tsx     카드 한 장 + 좌우로 끄는 기능
//   StartScreen.tsx   시작 화면
//   ReviewScreen.tsx  해설 화면
//   index.tsx         게임 진행 + 플레이 화면  ← 이 파일
//
// 화면은 phase 값 하나로 바꾼다:  "ready"(시작) → "playing"(플레이) → "review"(해설)

type Phase = "ready" | "playing" | "review";
type Feedback = { correct: boolean; text: string };

export default function PhishingGame({ onFinish }: GameProps) {
  // ① 상태(state): 바뀌면 화면이 다시 그려지는 값들
  const [phase, setPhase] = useState<Phase>("ready");
  const [deck, setDeck] = useState<Message[]>([]); // 이번 판 카드
  const [index, setIndex] = useState(0); // 지금 보고 있는 카드 번호
  const [correctIds, setCorrectIds] = useState<string[]>([]); // 맞힌 카드 id
  const [answeredCount, setAnsweredCount] = useState(0); // 답한 카드 수
  const [streak, setStreak] = useState(0); // 지금 연속 정답 수
  const [bestStreak, setBestStreak] = useState(0); // 이번 판 최고 연속 정답
  const [timeLeft, setTimeLeft] = useState(DURATION_SEC);
  const [feedback, setFeedback] = useState<Feedback | null>(null); // 답하면 잠깐 뜨는 한마디
  // onFinish 를 두 번 부르지 않도록 기억. 화면과 상관없어서 ref.
  const finished = useRef(false);
  // 게임이 끝나는 시각(ms). 남은 시간은 매번 이걸로 다시 계산한다
  const endsAt = useRef(0);

  const card = deck[index];

  // ② 시작 / 답하기
  function start() {
    setDeck(makeDeck());
    setIndex(0);
    setCorrectIds([]);
    setAnsweredCount(0);
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(DURATION_SEC);
    endsAt.current = Date.now() + DURATION_SEC * 1000;
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
    setFeedback({ correct, text: reaction(correct, card.phishing, nextStreak) });

    const isLastCard = index + 1 >= deck.length;
    if (isLastCard) setPhase("review");
    else setIndex(index + 1);
  }

  // ③ useEffect: 화면 밖의 일(타이머·키보드)을 붙였다 떼기
  // 공통 모양: 시작하는 코드 → return 으로 "정리하는 코드". 정리 안 하면 타이머가 계속 돈다.

  // 남은 시간 = 끝나는 시각 - 지금. 0이 되면 해설 화면으로
  // (1초마다 1씩 빼는 방식은 setInterval 이 늦게 불리면(백그라운드 탭 등) 실제보다 길어진다)
  // setTimeLeft 의 업데이트 함수 안에서 setPhase 를 부르지 않고, 둘을 나란히 부른다 (리뷰 반영)
  useEffect(() => {
    if (phase !== "playing") return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000));
      setTimeLeft(left); // 값이 같으면 React 가 다시 그리지 않는다
      if (left === 0) setPhase("review");
    }, 250);
    return () => clearInterval(timer);
  }, [phase]);

  // 한마디는 0.9초 뒤에 지운다
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 900);
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

  // ④ 점수 계산과 onFinish
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

  // ⑤ 화면: 바깥 틀은 공통, 안쪽만 phase 에 따라 바뀐다
  return (
    <div
      className={`relative flex min-h-[620px] w-full max-w-sm flex-col overflow-hidden rounded-[28px] bg-[#FFF6DC] p-5 text-black select-none ${sticker}`}
      // 공책 같은 점 무늬 배경
      style={{
        backgroundImage: "radial-gradient(rgba(0,0,0,0.12) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }}
    >
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
          streak={streak}
          feedback={feedback}
          onAnswer={answer}
        />
      )}
    </div>
  );
}

// [플레이 화면] 위: 진행도·시간 / 가운데: 카드 더미 / 아래: 버튼
interface PlayScreenProps {
  deck: Message[];
  index: number;
  correctIds: string[];
  timeLeft: number;
  streak: number;
  feedback: Feedback | null;
  onAnswer: (saysPhishing: boolean) => void;
}

function PlayScreen(props: PlayScreenProps) {
  const { deck, index, correctIds, timeLeft, streak, feedback, onAnswer } = props;
  const card = deck[index];
  const hurry = timeLeft <= 10;

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* 위: 시간 · 몇 번째 · 콤보 */}
      <div className="flex items-center gap-2">
        <div
          className={`${display.className} rounded-xl px-3 py-1 text-xl tabular-nums ${sticker} ${
            hurry ? "animate-pulse bg-[#FF5C8A]" : "bg-white"
          }`}
        >
          {timeLeft}초
        </div>
        <div className={`h-4 flex-1 overflow-hidden rounded-full bg-white ${sticker}`}>
          <div
            className={`h-full border-r-[2.5px] border-black transition-[width] duration-1000 ease-linear ${
              hurry ? "bg-[#FF5C8A]" : "bg-[#FFE45C]"
            }`}
            style={{ width: `${(timeLeft / DURATION_SEC) * 100}%` }}
          />
        </div>
        <div className={`${display.className} rounded-xl bg-white px-2.5 py-1 text-lg ${sticker}`}>
          {index + 1}/{deck.length}
        </div>
      </div>

      {/* 진행도: 맞힌 칸 초록, 틀린 칸 분홍 */}
      <div className="flex gap-1">
        {deck.map((m, i) => (
          <div
            key={m.id}
            className={`h-2.5 flex-1 rounded-full border-2 border-black ${
              i < index
                ? correctIds.includes(m.id)
                  ? "bg-[#A6F04F]"
                  : "bg-[#FF5C8A]"
                : i === index
                  ? "bg-black"
                  : "bg-white"
            }`}
          />
        ))}
      </div>

      {/* 카드 더미: 뒤에 다음 카드가 삐뚤게 깔려 있다 */}
      <div className="relative flex-1">
        {deck[index + 1] && (
          <div className="absolute inset-0 rotate-3 rounded-[22px] border-[2.5px] border-black bg-[#7CA8FF]" />
        )}
        {deck[index + 2] && (
          <div className="absolute inset-0 -rotate-2 rounded-[22px] border-[2.5px] border-black bg-[#A6F04F]" />
        )}
        {/* key 가 바뀌면 React가 새 카드로 갈아끼워서, 끌던 위치가 초기화된다 */}
        <SwipeCard key={card.id} message={card} onSwipe={onAnswer} />

        {/* 답하면 뜨는 한마디 */}
        {feedback && (
          <div
            className={`${display.className} pointer-events-none absolute inset-x-0 -top-3 z-10 mx-auto w-fit -rotate-3 rounded-xl px-4 py-1.5 text-xl ${sticker} ${
              feedback.correct ? "bg-[#A6F04F]" : "bg-[#FF5C8A]"
            }`}
          >
            {feedback.text}
          </div>
        )}
      </div>

      {/* 아래: 스와이프 대신 눌러도 된다 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          className={`${display.className} rounded-2xl bg-[#FF5C8A] py-3.5 text-2xl ${sticker} ${pressable}`}
          onClick={() => onAnswer(true)}
        >
          ← 피싱
        </button>
        <button
          className={`${display.className} rounded-2xl bg-[#A6F04F] py-3.5 text-2xl ${sticker} ${pressable}`}
          onClick={() => onAnswer(false)}
        >
          진짜 →
        </button>
      </div>
      {streak >= 3 && (
        <p className="-mt-2 text-center text-xs font-black">🔥 {streak}연속 정답 중</p>
      )}
    </div>
  );
}
