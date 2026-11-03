"use client";

import type { GameProps } from "../types";

// 담당: B · 식품생명공학과 — 식중독균 찾기 (기획서 6장)
export default function MicroscopeGame({ onFinish }: GameProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p>식품생명공학과 — 식중독균 찾기 게임 (준비 중)</p>
      <button className="rounded bg-black px-4 py-2 text-white" onClick={() => onFinish(0)}>
        임시: 바로 끝내기
      </button>
    </div>
  );
}
