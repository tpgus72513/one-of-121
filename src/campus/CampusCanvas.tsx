"use client";

import dynamic from "next/dynamic";
import Joystick from "./Joystick";
import Player from "./Player";

// 담당: C · 3D 캠퍼스를 페이지에 붙이는 연결 파일.
//
// 3D(WebGL)는 브라우저에서만 돌아서, 서버에서 미리 그리면 안 된다 → ssr: false.
// 그런데 ssr: false 는 클라이언트 컴포넌트("use client") 안에서만 쓸 수 있다 (Next.js 규칙).
// 페이지(page.tsx)는 서버 컴포넌트라서, 이 파일을 따로 둔 것.
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#BFE3FF]">캠퍼스 불러오는 중…</div>
  ),
});
// Player 는 일반 import. 어차피 브라우저 전용인 <Scene> 안에서만 그려지고,
// 따로 dynamic 으로 불러오면 Scene 보다 늦게 떠서 잠깐 카메라가 엉뚱한 곳을 본다.

export default function CampusCanvas() {
  // B의 <Building /> 이 생기면 여기 <Scene> 안에 넣고, 건물 상자를 Player 의 obstacles 로 넘긴다
  return (
    <>
      <Scene>
        <Player />
      </Scene>
      {/* 폰에서만 보이는 조이스틱 (3D 위에 떠 있다) */}
      <Joystick />
    </>
  );
}
