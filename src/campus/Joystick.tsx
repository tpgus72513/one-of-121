"use client";

import { useRef, useState, type PointerEvent } from "react";
import { joystick } from "./playerState";

// 담당: A · 폰용 조이스틱. 3D 위에 떠 있는 화면 버튼이다 (Canvas 밖).
// 엄지로 동그라미를 밀면 playerState 의 joystick 값이 바뀌고, Player 가 그걸 읽어서 움직인다.
// 터치 화면(pointer: coarse)에서만 보인다.

const MAX = 40; // 손잡이가 가운데에서 최대 몇 px 까지 나가나

export default function Joystick() {
  const [knob, setKnob] = useState({ x: 0, y: 0 }); // 손잡이 위치(px) — 화면 표시용
  const center = useRef<{ x: number; y: number } | null>(null);

  function move(e: PointerEvent<HTMLDivElement>) {
    if (!center.current) return;
    let x = e.clientX - center.current.x;
    let y = e.clientY - center.current.y;
    const len = Math.hypot(x, y);
    if (len > MAX) {
      x = (x / len) * MAX; // 동그라미 밖으로 못 나가게
      y = (y / len) * MAX;
    }
    setKnob({ x, y });
    joystick.x = x / MAX;
    joystick.y = -y / MAX; // 화면은 아래가 +y 라서 뒤집는다 (위로 밀면 앞으로)
  }

  function start(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    center.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    move(e);
  }

  function end() {
    center.current = null;
    setKnob({ x: 0, y: 0 });
    joystick.x = 0;
    joystick.y = 0;
  }

  return (
    <div
      className="pointer-coarse:flex absolute bottom-24 left-6 hidden size-28 touch-none items-center justify-center rounded-full border-2 border-white/70 bg-black/20 backdrop-blur-sm select-none"
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
    >
      <div
        className="size-12 rounded-full bg-white/90 shadow-lg"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  );
}
