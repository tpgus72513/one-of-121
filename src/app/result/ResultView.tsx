"use client";

import Link from "next/link";
import departments from "@/data/departments.json";
import { loadLastResult } from "@/lib/storage";
import { useMounted } from "@/lib/useMounted";

// 담당: C · 결과 화면 (임시 최소 버전). AI 결과 카드·공유·이미지 저장은 P2에서 붙인다.
export default function ResultView() {
  const mounted = useMounted();
  if (!mounted) return null;

  const result = loadLastResult();
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

  const dept = departments.find((d) => d.id === result.deptId);
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-sm font-semibold text-black/60">오늘 하루, {dept?.name}</p>
      <p className="text-6xl font-bold">
        {result.score}
        <span className="text-2xl">점</span>
      </p>
      {!result.saved && (
        <p className="text-xs text-black/50">(랭킹 저장은 실패했어요. 점수는 그대로예요)</p>
      )}
      <div className="flex gap-3">
        <Link className="rounded-full bg-black px-5 py-2.5 font-semibold text-white" href="/campus">
          캠퍼스로 돌아가기
        </Link>
        <Link
          className="rounded-full border border-black px-5 py-2.5 font-semibold"
          href="/ranking"
        >
          랭킹 보기
        </Link>
      </div>
    </div>
  );
}
