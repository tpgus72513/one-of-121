import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import departments from "@/data/departments.json";
import { createReadClient } from "@/lib/supabase";

// 담당: C · 랭킹 — 세종캠 학과 대항전 + 개인 TOP 10
// DB 값은 ranking.sql 의 view 2개에서 읽는다.

const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? id;

export default function RankingPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-center text-2xl font-bold">랭킹</h1>
      {/* 랭킹은 볼 때마다 새로 읽는다 → 읽는 동안 이 자리에 "불러오는 중" (Next 16 규칙: Suspense) */}
      <Suspense fallback={<p className="text-center text-black/50">불러오는 중…</p>}>
        <RankingTables />
      </Suspense>
      <Link className="text-center underline" href="/campus">
        캠퍼스로 돌아가기
      </Link>
    </main>
  );
}

interface DeptRow {
  real_dept: string;
  plays: number;
  avg_score: number;
}
interface PlayerRow {
  nickname: string;
  real_dept: string;
  game_dept: string;
  score: number;
}

async function RankingTables() {
  // 빌드할 때 미리 그려두지 말고, 사람이 들어올 때마다 새로 읽기
  await connection();

  const supabase = createReadClient();
  if (!supabase)
    return <p className="text-center text-black/50">랭킹 준비 중이에요 (DB 연결 전)</p>;

  const [depts, top] = await Promise.all([
    supabase.from("ranking_depts").select("real_dept, plays, avg_score").returns<DeptRow[]>(),
    supabase
      .from("ranking_top10")
      .select("nickname, real_dept, game_dept, score")
      .returns<PlayerRow[]>(),
  ]);
  if (depts.error || top.error) {
    console.error("[ranking]", depts.error?.message, top.error?.message);
    return (
      <p className="text-center text-black/50">랭킹을 불러오지 못했어요. 잠시 뒤 다시 봐 주세요.</p>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-2">
        <h2 className="font-bold">🏫 세종캠 학과 대항전</h2>
        <p className="text-xs text-black/50">내 학과 사람들이 받은 점수의 평균</p>
        {depts.data.length === 0 ? (
          <Empty />
        ) : (
          <ol className="flex flex-col divide-y divide-black/10 rounded-2xl border border-black/15 bg-white">
            {depts.data.map((d, i) => (
              <li key={d.real_dept} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-6 font-bold tabular-nums">{i + 1}</span>
                <span className="flex-1 truncate">{deptName(d.real_dept)}</span>
                <span className="text-xs text-black/50">{d.plays}판</span>
                <span className="w-12 text-right font-bold tabular-nums">{d.avg_score}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">🏆 개인 TOP 10</h2>
        {top.data.length === 0 ? (
          <Empty />
        ) : (
          <ol className="flex flex-col divide-y divide-black/10 rounded-2xl border border-black/15 bg-white">
            {top.data.map((p, i) => (
              <li
                key={`${p.nickname}-${p.real_dept}`}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <span className="w-6 font-bold tabular-nums">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p.nickname}</span>
                  <span className="block truncate text-xs text-black/50">
                    {deptName(p.real_dept)} → {deptName(p.game_dept)} 체험
                  </span>
                </span>
                <span className="w-10 text-right font-bold tabular-nums">{p.score}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}

function Empty() {
  return (
    <p className="rounded-2xl border border-dashed border-black/20 p-4 text-center text-sm text-black/50">
      아직 기록이 없어요. 첫 번째가 되어 보세요!
    </p>
  );
}
