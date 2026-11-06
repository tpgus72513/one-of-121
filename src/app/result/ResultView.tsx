"use client";

import { toPng } from "html-to-image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import departments from "@/data/departments.json";
import { loadProfile, useLastResult, type LastResult } from "@/lib/storage";
import { fallbackCard, fetchCard, type CardText } from "./resultCard";

// 담당: C · 결과 화면 — 점수 + AI 결과 카드 + 이미지 저장 + 공유

const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? id;

export default function ResultView() {
  // 항상 "방금 끝낸 판" 결과 (storage.ts 의 useLastResult 설명 참고)
  const result = useLastResult();
  if (result === undefined) return null;
  if (!result) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p>아직 플레이한 기록이 없어요.</p>
        <Link className="underline" href="/campus">
          캠퍼스로 가기
        </Link>
      </div>
    );
  }
  // key: 결과가 바뀌면 카드도 처음부터 (문구 다시 받아오기)
  return <ResultCard key={result.at} result={result} />;
}

function ResultCard({ result: initial }: { result: LastResult }) {
  // 처음 받은 결과를 고정 (부모가 다시 그려져도 문구를 또 받아오지 않게. 새 결과면 key 로 새로 만들어짐)
  const [result] = useState(initial);
  const cardRef = useRef<HTMLDivElement>(null);
  const name = deptName(result.deptId);
  const [card, setCard] = useState<CardText | null>(null);
  const [notice, setNotice] = useState("");

  // AI 문구 받아오기 (B의 API). 실패하면 fetchCard 가 기본 문구를 돌려준다
  // 이미 받았으면 다시 안 받는다 — 숨겼다 다시 보일 때(Activity) 문구가 바뀌거나 AI 요금이 또 나가지 않게
  useEffect(() => {
    if (card) return;
    let cancelled = false;
    const profile = loadProfile();
    fetchCard(
      {
        nickname: profile?.nickname ?? "",
        realDept: profile?.realDept ?? "",
        gameDept: result.deptId,
        gameId: result.gameId,
        score: result.score,
        detail: result.detail,
      },
      name,
    ).then((c) => {
      if (!cancelled) setCard(c);
    });
    return () => {
      cancelled = true;
    };
  }, [card, result, name]);

  const shown = card ?? fallbackCard(name, result.score);

  async function saveImage() {
    if (!cardRef.current) return;
    try {
      // pixelRatio 2: 인스타 스토리에 올려도 안 흐리게
      const url = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = "121분의1-결과.png";
      a.click();
    } catch {
      setNotice("이미지 저장이 안 되는 브라우저예요. 화면을 캡처해 주세요!");
    }
  }

  async function share() {
    const text = `${shown.title} — ${name} ${result.score}점`;
    const url = location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: "121분의 1", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setNotice("링크를 복사했어요. 붙여넣어서 공유해 주세요!");
    } catch {
      // 공유 창을 닫은 경우 등 → 아무것도 안 함
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
      {/* 이 상자 그대로 이미지로 저장된다 */}
      <div
        ref={cardRef}
        className="flex w-full flex-col gap-3 rounded-3xl border-[2.5px] border-black bg-[#FFF6DC] p-6 shadow-[4px_4px_0_#111]"
      >
        <p className="text-sm font-semibold text-black/60">오늘 하루, {name}</p>
        <p className="text-6xl font-bold">
          {result.score}
          <span className="text-2xl">점</span>
        </p>
        <p className="text-xl leading-snug font-bold">{shown.title}</p>
        <p className="text-sm leading-relaxed text-black/70">{shown.body}</p>
        <p className="mt-2 text-[11px] text-black/40">
          121분의 1 · 세종캠 학생이 만든 비공식 프로젝트
        </p>
      </div>

      {!result.saved && (
        <p className="text-xs text-black/50">(랭킹 저장은 실패했어요. 점수는 그대로예요)</p>
      )}
      {notice && <p className="text-sm font-semibold">{notice}</p>}

      <div className="grid w-full grid-cols-2 gap-2">
        <button
          className="rounded-full border border-black py-2.5 font-semibold"
          onClick={saveImage}
        >
          이미지 저장
        </button>
        <button className="rounded-full border border-black py-2.5 font-semibold" onClick={share}>
          공유하기
        </button>
        <Link className="rounded-full bg-black py-2.5 font-semibold text-white" href="/campus">
          캠퍼스로 돌아가기
        </Link>
        <Link className="rounded-full border border-black py-2.5 font-semibold" href="/ranking">
          랭킹 보기
        </Link>
      </div>
    </div>
  );
}
