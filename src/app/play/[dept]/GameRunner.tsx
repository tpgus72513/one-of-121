"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { games } from "@/games/registry";
import type { GameDetail } from "@/games/types";
import { loadProfile, saveLastResult } from "@/lib/storage";
import { useMounted } from "@/lib/useMounted";

// 담당: C · 게임 실행기
//
// 하는 일 (게임은 이걸 몰라도 된다)
//   1) registry 에서 게임을 찾아 띄운다
//   2) 게임이 뜬 순간부터 onFinish 까지 시간을 잰다 (playMs, types.ts 규칙)
//   3) onFinish 가 오면 /api/plays 에 저장하고 /result 로 넘어간다
//      저장이 실패해도(키 없음·인터넷 끊김) 결과는 보여준다. 플레이한 사람 탓이 아니니까.

interface GameRunnerProps {
  deptId: string;
  gameId: string;
}

export default function GameRunner({ deptId, gameId }: GameRunnerProps) {
  const router = useRouter();
  const mounted = useMounted();
  const startedAt = useRef(0); // 게임이 뜬 시각
  const finished = useRef(false); // onFinish 두 번 막기 (게임이 실수로 두 번 불러도 한 번만 저장)
  const [saving, setSaving] = useState(false);
  const [round, setRound] = useState(0); // 바뀌면 게임을 새로 그린다 (= 새 판)

  // 게임이 화면에 뜬 순간을 기록. 시간을 재는 일이라 화면과 상관없어서 ref
  // (다른 페이지 갔다가 돌아와서 다시 보일 때도 다시 실행된다)
  useEffect(() => {
    startedAt.current = performance.now();
  }, []);

  // Next.js 16 은 다른 페이지로 가도 이 페이지를 지우지 않고 숨겨 둔다 (Activity, 최대 3개).
  // 그대로 두면 다시 들어왔을 때 지난 판 해설 화면이 그대로 남아 있다.
  // → 숨겨지는 순간(정리 함수) 판을 초기화해서, 돌아오면 항상 새 판이 되게 한다.
  //   참고: node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md
  useLayoutEffect(() => {
    return () => {
      finished.current = false;
      setSaving(false);
      setRound((r) => r + 1);
    };
  }, []);

  const game = games[gameId];
  if (!game) return <p className="p-8">게임을 찾을 수 없어요 ({gameId})</p>;

  // 닉네임·학과는 브라우저에 저장돼 있다 → 서버에선 모르니까 브라우저에서 붙은 뒤에 확인
  if (!mounted) return null;
  const profile = loadProfile();
  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <p>먼저 닉네임과 내 학과를 정해 주세요.</p>
        <Link className="rounded-full bg-black px-5 py-2.5 font-semibold text-white" href="/">
          처음 화면으로
        </Link>
      </div>
    );
  }

  async function handleFinish(rawScore: number, detail?: GameDetail) {
    if (finished.current || !profile) return;
    finished.current = true;
    setSaving(true);

    const playMs = Math.round(performance.now() - startedAt.current);
    // 게임이 규칙(0~100 정수)을 어겨도 여기서 한 번 더 맞춘다
    const score = Math.min(100, Math.max(0, Math.round(rawScore)));

    let saved = false;
    try {
      const res = await fetch("/api/plays", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nickname: profile.nickname,
          realDept: profile.realDept,
          gameDept: deptId,
          gameId,
          score,
          playMs,
          detail: detail ?? null,
        }),
        // 서버가 멈춰도 "저장 중…"에 갇히지 않게 6초 뒤 포기 → 결과는 그대로 보여준다
        signal: AbortSignal.timeout(6000),
      });
      saved = res.ok;
      if (!res.ok) console.warn("[GameRunner] 저장 실패", res.status, await res.text());
    } catch (e) {
      console.warn("[GameRunner] 저장 요청 실패", e);
    }

    saveLastResult({ deptId, gameId, score, detail: detail ?? null, saved });
    router.push("/result");
  }

  const Game = game.component;
  return (
    <div className="relative flex w-full justify-center">
      <Game key={round} onFinish={handleFinish} />
      {saving && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 font-semibold">
          결과 저장 중…
        </div>
      )}
    </div>
  );
}
