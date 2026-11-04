"use client";

import { useRef, useState, type PointerEvent } from "react";
import type { Message } from "./deck";
import { display, sticker } from "./theme";

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
    // 손가락이 카드 밖으로 나가도 계속 이 카드가 이벤트를 받게 한다 (실패해도 드래그는 되게)
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
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
  const savedContact = !/^[+0-9]/.test(message.sender); // 숫자로 시작하면 저장 안 된 번호

  return (
    <div
      className={`absolute inset-0 flex cursor-grab touch-pan-y flex-col overflow-hidden rounded-[22px] bg-white active:cursor-grabbing ${sticker}`}
      style={{
        transform: `translateX(${dragX}px) rotate(${tilt * 10}deg)`,
        // 끄는 중엔 손을 바로 따라오게, 놓으면 통통 튀며 돌아가게
        transition: dragging ? "none" : "transform 0.3s cubic-bezier(.3,1.6,.5,1)",
      }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onLostPointerCapture={handleUp}
    >
      {/* 위: 보낸 사람 */}
      <div className="flex items-center gap-3 border-b-[2.5px] border-black bg-[#FFE45C] px-4 py-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full border-[2.5px] border-black text-lg font-black ${
            savedContact ? "bg-[#7CA8FF]" : "bg-neutral-200"
          }`}
        >
          {savedContact ? message.sender[0] : "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-black">{message.sender}</p>
          <p className="text-xs font-semibold text-black/60">
            {savedContact ? "문자 메시지" : "저장되지 않은 번호"} · 지금
          </p>
        </div>
        {message.school && (
          <span className="shrink-0 -rotate-6 rounded-md border-2 border-black bg-white px-1.5 py-0.5 text-[11px] font-black">
            세종캠
          </span>
        )}
      </div>

      {/* 말풍선 */}
      <div className="flex-1 bg-[#F4F1EA] px-4 py-5">
        <div className="w-fit max-w-[94%] rounded-2xl rounded-tl-sm border-2 border-black bg-white px-4 py-3 text-[15px] leading-relaxed font-medium break-all">
          <HighlightLinks text={message.body} />
        </div>
      </div>

      {/* 밀 때 나타나는 도장. tilt 만큼 진해진다 */}
      <Stamp label="피싱임" color="bg-[#FF5C8A]" side="left" opacity={-tilt} />
      <Stamp label="진짜임" color="bg-[#A6F04F]" side="right" opacity={tilt} />
    </div>
  );
}

// 문장 속 링크(주소)만 파란 밑줄로 보여준다. 진짜 폰도 링크를 이렇게 표시한다.
const LINK = /([\w-]+(?:\.[\w-]+)+(?:\/\S*)?)/g;
function HighlightLinks({ text }: { text: string }) {
  // split 에 괄호 있는 정규식을 넣으면, 잘린 조각과 링크가 번갈아 나온다 → 홀수 칸이 링크
  return text.split(LINK).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="font-semibold text-[#2F5BFF] underline underline-offset-2">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function Stamp(props: { label: string; color: string; side: "left" | "right"; opacity: number }) {
  const left = props.side === "left";
  return (
    <div
      className={`${display.className} pointer-events-none absolute bottom-8 rounded-xl border-[3px] border-black px-4 py-1.5 text-3xl shadow-[3px_3px_0_#111] ${props.color} ${
        left ? "right-4 rotate-[14deg]" : "left-4 -rotate-[14deg]"
      }`}
      style={{ opacity: Math.max(0, props.opacity), scale: 0.8 + Math.max(0, props.opacity) * 0.2 }}
    >
      {props.label}
    </div>
  );
}
