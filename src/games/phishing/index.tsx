"use client";

import type { GameProps } from "../types";

// 담당: A · 인공지능사이버보안학과 — 피싱 판별 (기획서 6장)
export default function PhishingGame({ onFinish }: GameProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p>인공지능사이버보안학과 — 피싱 판별 게임 (준비 중)</p>
      <button className="rounded bg-black px-4 py-2 text-white" onClick={() => onFinish(0)}>
        임시: 바로 끝내기
      </button>
    </div>
  );
}
