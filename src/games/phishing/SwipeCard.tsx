"use client";

import { useRef, useState, type PointerEvent } from "react";
import type { Message } from "./deck";

const SWIPE_THRESHOLD = 100; // 이만큼(px) 끌어야 답으로 인정

interface SwipeCardProps {
  message: Message;
  /** 카드를 충분히 밀었을 때 호출. 왼쪽이면 true(피싱), 오른쪽이면 false(진짜) */
  onSwipe: (saysPhishing: boolean) => void;
}

// 문자 카드 한 장 + 좌우로 끄는 기능. 실제 폰 문자 화면처럼 보이게 꾸몄다.
// pointer 이벤트는 마우스·터치·펜을 하나로 묶은 이벤트라서, 이것만 쓰면 PC와 폰이 둘 다 된다.
export default function SwipeCard({ message, onSwipe }: SwipeCardProps) {
  const [dragX, setDragX] = useState(0); // 카드가 원래 자리에서 옆으로 얼마나 움직였나(px)
  const [dragging, setDragging] = useState(false); // 지금 손가락/마우스로 잡고 있나
  // 처음 누른 x좌표. 화면에 그릴 필요가 없는 값이라 state가 아니라 ref에 둔다.
  const startX = useRef<number | null>(null);

  // 1) 누를 때: 시작 위치 기억
  function handleDown(e: PointerEvent<HTMLDivElement>) {
    startX.current = e.clientX;
    setDragging(true);
    // 손가락이 카드 밖으로 나가도 계속 이 카드가 이벤트를 받게 한다
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  // 2) 움직일 때: 시작 위치와의 차이만큼 카드를 옮긴다
  function handleMove(e: PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return;
    setDragX(e.clientX - startX.current);
  }

  // 3) 뗄 때: 충분히 밀었으면 답, 아니면 제자리로
  function handleUp(e: PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return; // 이미 처리했으면 무시 (up 다음에 lostpointercapture 가 또 온다)
    // dragX(state)는 아주 빨리 밀고 떼면 아직 갱신 전일 수 있다 → 이벤트 좌표로 다시 계산
    const dx = e.clientX - startX.current;
    startX.current = null;
    setDragging(false);

    if (dx <= -SWIPE_THRESHOLD) onSwipe(true);
    else if (dx >= SWIPE_THRESHOLD) onSwipe(false);
    else setDragX(0);
  }

  // 얼마나 밀었는지를 -1 ~ 1 로 바꾼 값. 카드 기울기·도장 진하기에 쓴다.
  const tilt = Math.max(-1, Math.min(1, dragX / SWIPE_THRESHOLD));

  return (
    <div
      className="absolute inset-0 flex cursor-grab touch-pan-y flex-col overflow-hidden rounded-3xl bg-white text-slate-900 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] active:cursor-grabbing"
      style={{
        transform: `translateX(${dragX}px) rotate(${tilt * 8}deg)`,
        // 끄는 중엔 손을 바로 따라오게, 놓으면 부드럽게 돌아가게
        transition: dragging ? "none" : "transform 0.25s cubic-bezier(.2,.8,.2,1)",
      }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onLostPointerCapture={handleUp}
    >
      {/* 문자 앱 윗부분: 보낸 사람 */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <Avatar sender={message.sender} />
        <div className="min-w-0">
          <p className="truncate font-bold">{message.sender}</p>
          <p className="text-xs text-slate-400">문자 메시지 · 방금 전</p>
        </div>
      </div>

      {/* 말풍선 */}
      <div className="flex-1 bg-slate-50 px-4 py-5">
        <div className="w-fit max-w-[92%] rounded-2xl rounded-tl-md bg-white px-4 py-3 text-[15px] leading-relaxed break-all shadow-sm ring-1 ring-slate-100">
          <HighlightLinks text={message.body} />
        </div>
      </div>

      {/* 밀 때 나타나는 도장. tilt 만큼 진해진다 */}
      <Stamp side="left" opacity={-tilt} />
      <Stamp side="right" opacity={tilt} />
    </div>
  );
}

// 보낸 사람 동그라미. 전화번호면 사람 아이콘, 이름이면 첫 글자
function Avatar({ sender }: { sender: string }) {
  const isNumber = sender.startsWith("+");
  return (
    <div
      className={`flex size-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${
        isNumber ? "bg-slate-400" : "bg-linear-to-br from-indigo-500 to-violet-500"
      }`}
    >
      {isNumber ? "👤" : sender[0]}
    </div>
  );
}

// 문장 속 링크(주소)만 파란 밑줄로 보여준다. 진짜 폰도 링크를 이렇게 표시한다.
const LINK = /([\w-]+(?:\.[\w-]+)+(?:\/\S*)?)/g;
function HighlightLinks({ text }: { text: string }) {
  // split 에 괄호 있는 정규식을 넣으면, 잘린 조각과 링크가 번갈아 나온다 → 홀수 칸이 링크
  return text.split(LINK).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="text-blue-600 underline underline-offset-2">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function Stamp({ side, opacity }: { side: "left" | "right"; opacity: number }) {
  const isLeft = side === "left";
  return (
    <div
      className={`pointer-events-none absolute top-24 rounded-xl border-4 px-3 py-1 text-2xl font-black tracking-wider ${
        isLeft
          ? "right-5 rotate-12 border-rose-500 text-rose-500"
          : "left-5 -rotate-12 border-emerald-500 text-emerald-500"
      }`}
      style={{ opacity: Math.max(0, opacity) }}
    >
      {isLeft ? "피싱 🚨" : "안전 ✅"}
    </div>
  );
}
