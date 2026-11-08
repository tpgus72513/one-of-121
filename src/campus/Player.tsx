"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, Vector3, type Group } from "three";
import { joystick, playerPosition, type Obstacle } from "./playerState";

// 담당: A · 캐릭터 이동 — 키보드 + 모바일 조이스틱, 카메라 따라가기
//
// <Scene> 안에 넣어서 쓴다.   <Scene><Player obstacles={건물 상자들} /></Scene>
// 매 프레임(useFrame) 입력을 읽어서 → 위치를 옮기고 → 카메라가 뒤따라온다.

const SPEED = 9; // 1초에 몇 칸(m) 움직이나
const RADIUS = 0.6; // 캐릭터 몸 반지름. 벽에 이만큼 떨어져서 멈춘다
const BOUNDS = 58; // 캠퍼스 끝. Scene 의 CAMPUS_SIZE(120) 절반에서 조금 안쪽
const CAMERA_OFFSET = new Vector3(0, 14, 16); // 캐릭터 기준 카메라 자리 (위로 14, 뒤로 16)
const cameraGoal = new Vector3(); // 매 프레임 새로 만들지 않고 이걸 재사용

interface PlayerProps {
  /** 부딪히는 상자들 (건물). 없으면 캠퍼스 끝에만 막힌다 */
  obstacles?: Obstacle[];
}

export default function Player({ obstacles = [] }: PlayerProps) {
  const body = useRef<Group>(null);
  const keys = useRef(new Set<string>()); // 지금 눌려 있는 키들

  // 키보드: 누르면 Set 에 넣고, 떼면 뺀다
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keys.current.add(e.code);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const clear = () => keys.current.clear(); // 다른 창으로 가면 "계속 눌린 채"가 되지 않게
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);

  // (x, z)에 서 있으면 어딘가에 끼는가?
  function blocked(x: number, z: number) {
    if (Math.abs(x) > BOUNDS || Math.abs(z) > BOUNDS) return true;
    return obstacles.some(
      (o) => Math.abs(x - o.x) < o.width / 2 + RADIUS && Math.abs(z - o.z) < o.depth / 2 + RADIUS,
    );
  }

  useFrame((state, delta) => {
    const g = body.current;
    if (!g) return;
    const dt = Math.min(delta, 0.1); // 탭 전환 뒤 첫 프레임에 순간이동하지 않게

    // 1) 입력 → 방향.  화면 위쪽 = -z, 오른쪽 = +x
    const k = keys.current;
    let dx = joystick.x;
    let dz = -joystick.y;
    if (k.has("KeyW") || k.has("ArrowUp")) dz -= 1;
    if (k.has("KeyS") || k.has("ArrowDown")) dz += 1;
    if (k.has("KeyA") || k.has("ArrowLeft")) dx -= 1;
    if (k.has("KeyD") || k.has("ArrowRight")) dx += 1;
    const len = Math.hypot(dx, dz);
    if (len > 1) {
      dx /= len; // 대각선이 더 빠르지 않게 길이를 1로 맞춘다
      dz /= len;
    }
    const moving = len > 0.05;

    // 2) 이동. x 와 z 를 따로 해봐야 벽에 비스듬히 부딪혀도 벽을 따라 미끄러진다
    const p = playerPosition;
    const nx = p.x + dx * SPEED * dt;
    if (!blocked(nx, p.z)) p.x = nx;
    const nz = p.z + dz * SPEED * dt;
    if (!blocked(p.x, nz)) p.z = nz;

    // 3) 캐릭터 모양: 위치 반영 + 가는 쪽 바라보기 + 걸을 때 통통
    g.position.set(p.x, 0, p.z);
    if (moving) {
      const target = Math.atan2(dx, dz);
      // 각도를 바로 바꾸면 휙 돌아서, 가까운 쪽으로 조금씩 돌린다
      const diff = Math.atan2(Math.sin(target - g.rotation.y), Math.cos(target - g.rotation.y));
      g.rotation.y += diff * Math.min(1, dt * 12);
    }
    const bob = moving ? Math.abs(Math.sin(state.clock.elapsedTime * 12)) * 0.15 : 0;
    g.children[0].position.y = MathUtils.lerp(g.children[0].position.y, bob, 0.3);

    // 4) 카메라: 정해진 자리로 부드럽게 따라가서 캐릭터를 본다
    const cam = state.camera;
    cam.position.lerp(cameraGoal.copy(p).add(CAMERA_OFFSET), Math.min(1, dt * 5));
    cam.lookAt(p.x, 1, p.z);
  });

  return (
    <group ref={body} position={[playerPosition.x, 0, playerPosition.z]}>
      {/* 몸 전체 (통통 튀는 건 이 안쪽 그룹만) */}
      <group>
        {/* 몸통: 캡슐 */}
        <mesh position={[0, 1, 0]} castShadow>
          <capsuleGeometry args={[0.55, 0.9, 6, 12]} />
          <meshStandardMaterial color="#FFB86B" />
        </mesh>
        {/* 눈 두 개 (앞 = +z) */}
        <mesh position={[-0.2, 1.45, 0.48]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0.2, 1.45, 0.48]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        {/* 백팩 (대학생이니까) */}
        <mesh position={[0, 1.05, -0.55]} castShadow>
          <boxGeometry args={[0.7, 0.8, 0.35]} />
          <meshStandardMaterial color="#5B7CFA" />
        </mesh>
      </group>
    </group>
  );
}
