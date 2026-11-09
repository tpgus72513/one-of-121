"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import MicroscopeGame from ".";

// 공통 게임 실행기 연결 전, 체험 화면에서 게임을 직접 확인하기 위한 최소 연결.
// 점수는 게임 안에서 확인하며 서버 저장은 공통 실행기에서 연결한다.
export default function MicroscopePreview() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);

  function finishPreview() {
    // Next.js가 뒤로 가기 때 화면을 복원하므로, 완료한 게임은 떠나기 전에 초기화한다.
    setAttempt((current) => current + 1);
    router.push("/campus");
  }

  return <MicroscopeGame key={attempt} onFinish={finishPreview} />;
}
