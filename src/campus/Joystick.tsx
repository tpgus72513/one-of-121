"use client";

import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { joystick } from "./playerState";

// 담당: A · 폰용 "떠다니는" 조이스틱. 3D 위에 깔린 투명한 판이다 (Canvas 밖).
//
// 화면 아무 데나 엄지를 대면 → 그 자리에 조이스틱이 생기고 → 밀면 playerState 의 joystick 값이 바뀐다.
// 그래서 오른손잡이·왼손잡이 모두 편한 쪽에서 쓸 수 있다. 손을 떼면 오른쪽 아래에 작게 "여기" 표시만 남는다.
// 터치 화면(pointer: coarse)에서만 보인다. 바로 가기 버튼처럼 이 판보다 위에 있는 버튼은 그대로 눌린다.

const SIZE = 80; // 조이스틱 판 지름(px)
const MAX = 28; // 손잡이가 가운데에서 최대 몇 px 까지 나가나

type Point = { x: number; y: number };

export default function Joystick() {
  const [pad, setPad] = useState<Point | null>(null); // 엄지를 댄 자리 (판 기준 px). null = 손 뗌
  const [knob, setKnob] = useState<Point>({ x: 0, y: 0 }); // 손잡이가 가운데에서 얼마나 밀렸나
  const finger = useRef<number | null>(null); // 지금 조이스틱을 잡은 손가락. 두 번째 손가락은 무시
  const origin = useRef<Point>({ x: 0, y: 0 }); // 엄지를 댄 화면 좌표

  function start(e: PointerEvent<HTMLDivElement>) {
    if (finger.current !== null) return;
    finger.current = e.pointerId;
    const r = e.currentTarget.getBoundingClientRect();
    origin.current = { x: e.clientX, y: e.clientY };
    setPad({ x: e.clientX - r.left, y: e.clientY - r.top });
    setKnob({ x: 0, y: 0 });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  }

  function move(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerId !== finger.current) return;
    let x = e.clientX - origin.current.x;
    let y = e.clientY - origin.current.y;
    const len = Math.hypot(x, y);
    if (len > MAX) {
      x = (x / len) * MAX; // 동그라미 밖으로 못 나가게
      y = (y / len) * MAX;
    }
    setKnob({ x, y });
    joystick.x = x / MAX;
    joystick.y = -y / MAX; // 화면은 아래가 +y 라서 뒤집는다 (위로 밀면 앞으로)
  }

  function end(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerId !== finger.current) return;
    finger.current = null;
    setPad(null);
    setKnob({ x: 0, y: 0 });
    joystick.x = 0;
    joystick.y = 0;
  }

  return (
    <div
      className="pointer-coarse:block absolute inset-0 hidden touch-none select-none"
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
    >
      {pad ? (
        // 엄지를 댄 자리에 생기는 조이스틱
        <Pad style={{ left: pad.x - SIZE / 2, top: pad.y - SIZE / 2 }} knob={knob} />
      ) : (
        // 손 뗐을 때: 오른쪽 아래에 "여기를 누르면 돼요" 표시 (반투명)
        <Pad className="right-6 bottom-32 opacity-60" knob={{ x: 0, y: 0 }} />
      )}
    </div>
  );
}

// 스티커 스타일 조이스틱: 검은 테두리 + 노란 손잡이 + 각진 그림자 (피싱 게임과 같은 톤)
function Pad(props: { knob: Point; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`pointer-events-none absolute flex items-center justify-center rounded-full border-[2.5px] border-black bg-white/45 backdrop-blur-sm ${props.className ?? ""}`}
      style={{ width: SIZE, height: SIZE, ...props.style }}
    >
      <div
        className="size-9 rounded-full border-[2.5px] border-black bg-[#FFE45C] shadow-[2px_2px_0_#111]"
        style={{ transform: `translate(${props.knob.x}px, ${props.knob.y}px)` }}
      />
    </div>
  );
}
