"use client";

import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";

// 담당: C · 3D 뼈대 — 땅·조명·카메라 (기획서 5장, 9장)
//
// A의 <Player />, B의 <Building /> 은 children 으로 이 안에 들어온다.
//   <Scene>
//     <Player />
//     <Building ... />
//   </Scene>
//
// 좌표: 땅 한가운데가 (0, 0, 0), y가 위쪽. 1칸 = 1m 쯤으로 생각한다. (격자 한 칸 = 1)

const CAMPUS_SIZE = 120; // 캠퍼스(건물을 놓는 곳) 한 변 길이. 격자가 이만큼 깔린다
const GROUND_SIZE = 600; // 땅은 훨씬 넓게 깔아서 끝(모서리)이 안 보이게 한다
const SKY = "#BFE3FF";

export default function Scene({ children }: { children?: ReactNode }) {
  return (
    <Canvas
      shadows
      // 폰은 화면 밀도가 3배까지 높은데, 다 그리면 버벅인다 → 최대 2배까지만
      dpr={[1, 2]}
      // 위에서 비스듬히 내려다보는 시작 위치
      camera={{ position: [0, 25, 35], fov: 50 }}
    >
      {/* 하늘색 배경 + 멀리 있는 건 하늘색으로 흐려지게 (끝이 안 보여서 덜 어색함) */}
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={[SKY, 60, 140]} />

      {/* 조명 2개: 전체를 은은하게 + 해(그림자 담당) */}
      <hemisphereLight args={["#ffffff", "#9BC37A", 0.9]} />
      <directionalLight
        position={[30, 50, 20]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-CAMPUS_SIZE / 2}
        shadow-camera-right={CAMPUS_SIZE / 2}
        shadow-camera-top={CAMPUS_SIZE / 2}
        shadow-camera-bottom={-CAMPUS_SIZE / 2}
      />

      {/* 땅: 평평한 판을 눕힌다 (판은 원래 세로로 서 있어서 x축으로 -90도) */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
        <meshStandardMaterial color="#A8D58A" />
      </mesh>

      {/* 임시: 위치 잡기용 격자 (1칸 = 1, 굵은 선 = 10). 건물 배치가 끝나면 지운다 */}
      <Grid
        position={[0, 0.01, 0]}
        args={[CAMPUS_SIZE, CAMPUS_SIZE]}
        cellSize={1}
        sectionSize={10}
        cellColor="#8FBF6F"
        sectionColor="#5E8F45"
        fadeDistance={90}
      />

      {children}

      {/* 임시: 캐릭터(A)가 생기기 전까지 마우스·손가락으로 둘러보기.
          Player 가 카메라를 따라가게 되면 지운다. 땅 밑으로는 못 내려가게 각도 제한 */}
      <OrbitControls maxPolarAngle={Math.PI / 2.2} minDistance={5} maxDistance={100} />
    </Canvas>
  );
}
