"use client";

import { Outlines } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { useEffect, useMemo, type ReactNode, type RefObject } from "react";
import {
  CanvasTexture,
  DataTexture,
  NearestFilter,
  RedFormat,
  SRGBColorSpace,
  type Group,
} from "three";

// 담당: A · 캐릭터 생김새 — 과잠 입은 2등신 대학생.
// 움직이는 건 Player.tsx 가 하고, 이 파일은 "어떻게 생겼나"만 맡는다.
// 팔·다리·몸·눈은 Player 가 흔들 수 있게, Player 가 만든 손잡이(ref)를 각 부분에 걸어 둔다.

// 색은 여기만 바꾸면 된다
const JACKET = "#1F2E5A"; // 과잠 몸판 (네이비)
const SLEEVE = "#F3E9D2"; // 과잠 소매 (크림)
const LETTER = "#F6EBD4"; // 레터링 글자
const LETTER_EDGE = "#E4572E"; // 레터링 테두리
const SKIN = "#FFD9B8";
const HAIR = "#3B2A20";
const PANTS = "#3A3F4B";
const SHOE = "#FAFAFA";
const BAG = "#F2B84B";
const INK = "#1A1A1A"; // 외곽선

type PartRef = RefObject<Group | null>;

/** Player 가 움직이는 부분들. 부분마다 ref 하나씩 받아서 그 부분에 걸어 준다 */
export interface RigRefs {
  tiltRef: PartRef; // 몸 전체 기울이기
  bodyRef: PartRef; // 통통 튀기·찌그러지기
  headRef: PartRef; // 두리번거리기
  eyesRef: PartRef; // 눈 깜빡임
  legLRef: PartRef;
  legRRef: PartRef;
  armLRef: PartRef;
  armRRef: PartRef;
}

// 카툰(툰) 셰이딩: 명암을 3단계로 딱 끊는다. 부드러운 그라데이션보다 덜 "기본 3D" 같다
const toonSteps = new DataTexture(new Uint8Array([90, 170, 255]), 3, 1, RedFormat);
toonSteps.minFilter = NearestFilter;
toonSteps.magFilter = NearestFilter;
toonSteps.needsUpdate = true;

type PartProps = ThreeElements["mesh"] & { color: string; outline?: boolean; children: ReactNode };

// 도형 하나 = 툰 재질 + 검은 외곽선 (스티커 느낌, 피싱 게임과 같은 톤)
function Part({ color, outline = true, children, ...props }: PartProps) {
  return (
    <mesh castShadow {...props}>
      {children}
      <meshToonMaterial color={color} gradientMap={toonSteps} />
      {outline && <Outlines thickness={0.035} color={INK} />}
    </mesh>
  );
}

// 과잠 가슴 레터링 "121". 이미지 파일 없이 캔버스에 직접 그려서 텍스처로 쓴다
function useLetterTexture(text: string) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 160;
    const ctx = canvas.getContext("2d")!;
    ctx.font = "900 118px 'Arial Black', Impact, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    // 과잠 와펜처럼: 두꺼운 테두리 먼저, 그 위에 글자
    ctx.lineWidth = 24;
    ctx.strokeStyle = LETTER_EDGE;
    ctx.strokeText(text, 128, 86);
    ctx.fillStyle = LETTER;
    ctx.fillText(text, 128, 86);
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    return tex;
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

export default function PlayerModel({
  tiltRef,
  bodyRef,
  headRef,
  eyesRef,
  legLRef,
  legRRef,
  armLRef,
  armRRef,
}: RigRefs) {
  const letter = useLetterTexture("121");

  return (
    <group ref={tiltRef}>
      <group ref={bodyRef}>
        {/* 다리: 엉덩이 높이에 축(group)을 두고 그 아래로 매단다 → 축을 돌리면 다리가 흔들린다 */}
        {([-1, 1] as const).map((side) => (
          <group key={side} position={[side * 0.17, 0.55, 0]} ref={side < 0 ? legLRef : legRRef}>
            <Part color={PANTS} position={[0, -0.22, 0]}>
              <capsuleGeometry args={[0.12, 0.3, 4, 10]} />
            </Part>
            <Part color={SHOE} position={[0, -0.5, 0.05]}>
              <boxGeometry args={[0.22, 0.12, 0.34]} />
            </Part>
          </group>
        ))}

        {/* 몸통 = 과잠 */}
        <Part color={JACKET} position={[0, 0.95, 0]} scale={[1.1, 1, 0.85]}>
          <capsuleGeometry args={[0.42, 0.3, 6, 16]} />
        </Part>
        {/* 과잠 똑딱단추 */}
        {[1.18, 1.0, 0.82].map((y) => (
          <Part key={y} color={SLEEVE} outline={false} position={[0.05, y, 0.36]}>
            <sphereGeometry args={[0.03, 8, 8]} />
          </Part>
        ))}
        {/* 가슴 레터링 "121" */}
        <mesh position={[-0.14, 1.08, 0.365]} rotation-y={-0.28}>
          <planeGeometry args={[0.34, 0.21]} />
          <meshBasicMaterial map={letter} transparent toneMapped={false} />
        </mesh>
        {/* 목 시보리 (크림 + 네이비 줄) */}
        <Part color={SLEEVE} position={[0, 1.47, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.27, 0.07, 8, 20]} />
        </Part>

        {/* 팔: 어깨에 축 → 축을 돌리면 팔이 앞뒤로 흔들린다 */}
        {([-1, 1] as const).map((side) => (
          <group
            key={side}
            position={[side * 0.5, 1.3, 0]}
            rotation-z={side * 0.12}
            ref={side < 0 ? armLRef : armRRef}
          >
            <Part color={SLEEVE} position={[0, -0.24, 0]}>
              <capsuleGeometry args={[0.11, 0.3, 4, 10]} />
            </Part>
            <Part color={JACKET} outline={false} position={[0, -0.43, 0]}>
              <cylinderGeometry args={[0.118, 0.118, 0.06, 12]} />
            </Part>
            <Part color={SKIN} position={[0, -0.53, 0]}>
              <sphereGeometry args={[0.1, 10, 10]} />
            </Part>
          </group>
        ))}

        {/* 백팩 + 키링 */}
        <Part color={BAG} position={[0, 1.0, -0.44]}>
          <boxGeometry args={[0.56, 0.6, 0.26]} />
        </Part>
        <Part color={LETTER_EDGE} outline={false} position={[0.3, 0.82, -0.44]}>
          <sphereGeometry args={[0.06, 8, 8]} />
        </Part>

        {/* 머리 (2등신이라 크게) */}
        <group position={[0, 1.78, 0]} ref={headRef}>
          <Part color={SKIN}>
            <sphereGeometry args={[0.5, 24, 18]} />
          </Part>
          {/* 머리카락: 위쪽만 덮는 반구를 살짝 뒤로 */}
          <Part color={HAIR} position={[0, 0.06, -0.03]} rotation-x={-0.35}>
            <sphereGeometry args={[0.53, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          </Part>
          {/* 눈 (깜빡임용 group) */}
          <group ref={eyesRef} position={[0, 0, 0.45]}>
            {[-0.17, 0.17].map((x) => (
              <mesh key={x} position={[x, 0, 0]} scale={[1, 1.35, 1]}>
                <sphereGeometry args={[0.06, 10, 10]} />
                <meshBasicMaterial color={INK} />
              </mesh>
            ))}
          </group>
          {/* 볼터치 */}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.29, -0.12, 0.4]} rotation-y={side * 0.6}>
              <circleGeometry args={[0.07, 14]} />
              <meshBasicMaterial color="#FF8FA3" transparent opacity={0.7} />
            </mesh>
          ))}
          {/* 입 (작은 미소) */}
          <mesh position={[0, -0.14, 0.48]} rotation-z={Math.PI}>
            <torusGeometry args={[0.045, 0.012, 6, 12, Math.PI]} />
            <meshBasicMaterial color={INK} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
