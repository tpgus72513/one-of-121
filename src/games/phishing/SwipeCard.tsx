"use client";

import { useRef, useState, type PointerEvent } from "react";
import type { Message } from "./deck";

const SWIPE_THRESHOLD = 100; // 이만큼(px) 끌어야 답으로 인정

interface SwipeCardProps {
  message: Message;
  /** 카드를 충분히 밀었을 때 호출. 왼쪽이면 true(피싱), 오른쪽이면 false(진짜) */
  onSwipe: (saysPhishing: boolean) => void;
}

// 문자 카드 한 장 + 좌우로 끄는 기능.
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

  // 얼마나 밀었는지를 -1 ~ 1 로 바꾼 값. 카드 기울기·테두리 색에 쓴다.
  const tilt = Math.max(-1, Math.min(1, dragX / SWIPE_THRESHOLD));
  const outline = tilt <= -0.6 ? "3px solid #ef4444" : tilt >= 0.6 ? "3px solid #22c55e" : "none";

  return (
    <div
      className="absolute inset-0 flex cursor-grab touch-pan-y flex-col gap-3 rounded-2xl bg-white p-5 text-neutral-900 shadow-lg active:cursor-grabbing"
      style={{
        transform: `translateX(${dragX}px) rotate(${tilt * 8}deg)`,
        // 끄는 중엔 손을 바로 따라오게, 놓으면 부드럽게 돌아가게
        transition: dragging ? "none" : "transform 0.2s",
        outline,
      }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onLostPointerCapture={handleUp}
    >
      <p className="text-xs font-semibold text-neutral-500">📩 {message.sender}</p>
      <p className="text-[15px] leading-relaxed break-all">{message.body}</p>
    </div>
  );
}
