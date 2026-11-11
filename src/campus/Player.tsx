"use client";

import { Stats } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { MathUtils, Vector3, type Group } from "three";
import PlayerModel from "./PlayerModel";
import { joystick, playerPosition, type Obstacle } from "./playerState";

// 담당: A · 캐릭터 이동 — 키보드 + 모바일 조이스틱, 카메라 따라가기
//
// <Scene> 안에 넣어서 쓴다.   <Scene><Player obstacles={건물 상자들} /></Scene>
// 매 프레임(useFrame): 입력 → 속도(가속·감속) → 이동 → 방향·기울기 → 팔다리 → 카메라
// 생김새는 PlayerModel.tsx. 주소 끝에 ?fps 를 붙이면 초당 프레임이 화면에 뜬다 (폰 렉 확인용)

const MAX_SPEED = 9; // 1초에 몇 칸(m) 움직이나
const ACCEL = 9; // 출발할 때 최고 속도까지 붙는 빠르기 (클수록 빨리)
const DECEL = 7; // 멈출 때 서는 빠르기 (작을수록 미끄러지듯)
const RADIUS = 0.6; // 캐릭터 몸 반지름. 벽에 이만큼 떨어져서 멈춘다
const BOUNDS = 58; // 캠퍼스 끝. Scene 의 CAMPUS_SIZE(120) 절반에서 조금 안쪽
const CAMERA_OFFSET = new Vector3(0, 7, 10.5); // 캐릭터 기준 카메라 자리 (위로 7, 뒤로 10.5). 낮을수록 얼굴이 잘 보인다
const cameraGoal = new Vector3(); // 매 프레임 새로 만들지 않고 재사용
const cameraLook = new Vector3(playerPosition.x, 1.3, playerPosition.z); // 카메라가 보는 점 (이것도 부드럽게)

interface PlayerProps {
  /** 부딪히는 상자들 (건물). 없으면 캠퍼스 끝에만 막힌다 */
  obstacles?: Obstacle[];
}

// 각도 차이를 -π ~ π 로. (350° → 10° 를 "20° 돌기"로 계산하려고)
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export default function Player({ obstacles = [] }: PlayerProps) {
  const root = useRef<Group>(null);
  // 몸의 각 부분 손잡이. PlayerModel 이 이걸 해당 부분에 걸어 준다
  const tiltRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const eyesRef = useRef<Group>(null);
  const legLRef = useRef<Group>(null);
  const legRRef = useRef<Group>(null);
  const armLRef = useRef<Group>(null);
  const armRRef = useRef<Group>(null);
  const keys = useRef(new Set<string>()); // 지금 눌려 있는 키들
  // 매 프레임 바뀌는 값들 (화면을 다시 그릴 필요 없어서 state 가 아니라 ref)
  const motion = useRef({ vx: 0, vz: 0, phase: 0, still: 0, blinkAt: 2, blinkUntil: 0 });
  const [showFps] = useState(() => new URLSearchParams(window.location.search).has("fps"));

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
    const g = root.current;
    if (!g) return;
    const tilt = tiltRef.current;
    const body = bodyRef.current;
    const head = headRef.current;
    const eyes = eyesRef.current;
    const [legL, legR] = [legLRef.current, legRRef.current];
    const [armL, armR] = [armLRef.current, armRRef.current];
    const dt = Math.min(delta, 0.1); // 탭 전환 뒤 첫 프레임에 순간이동하지 않게
    const t = state.clock.elapsedTime;
    const m = motion.current;
    const { damp } = MathUtils; // damp(지금, 목표, 빠르기, dt): 목표 쪽으로 부드럽게 다가가기

    // 1) 입력 → 가고 싶은 방향.  화면 위쪽 = -z, 오른쪽 = +x
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

    // 2) 속도: 바로 최고 속도가 아니라 붙었다가(가속) 미끄러지듯 선다(감속)
    const pushing = len > 0.05;
    m.vx = damp(m.vx, dx * MAX_SPEED, pushing ? ACCEL : DECEL, dt);
    m.vz = damp(m.vz, dz * MAX_SPEED, pushing ? ACCEL : DECEL, dt);

    // 3) 이동. x 와 z 를 따로 해봐야 벽에 비스듬히 부딪혀도 벽을 따라 미끄러진다
    const p = playerPosition;
    const nx = p.x + m.vx * dt;
    if (blocked(nx, p.z)) m.vx = 0;
    else p.x = nx;
    const nz = p.z + m.vz * dt;
    if (blocked(p.x, nz)) m.vz = 0;
    else p.z = nz;
    g.position.set(p.x, 0, p.z);

    const speed = Math.hypot(m.vx, m.vz);
    const s = Math.min(1, speed / MAX_SPEED); // 0(서 있음) ~ 1(최고 속도)

    // 4) 가는 쪽으로 몸 돌리기 + 꺾을 때 그 안쪽으로 살짝 기울기
    let turnRate = 0;
    if (speed > 0.4) {
      const diff = wrapAngle(Math.atan2(m.vx, m.vz) - g.rotation.y);
      const step = diff * Math.min(1, dt * 10);
      g.rotation.y += step;
      turnRate = step / dt;
    }
    if (tilt) {
      tilt.rotation.x = damp(tilt.rotation.x, s * 0.2, 8, dt); // 달릴수록 앞으로 숙이기
      tilt.rotation.z = damp(
        tilt.rotation.z,
        MathUtils.clamp(-turnRate * 0.04, -0.25, 0.25),
        6,
        dt,
      );
    }

    // 5) 걷기: 간 거리만큼 걸음 박자가 진행 → 빨리 가면 팔다리도 빨리
    m.phase += speed * dt * 1.3;
    const swing = Math.sin(m.phase) * 0.85 * s;
    const step = Math.abs(Math.cos(m.phase)); // 발 디딜 때 1
    if (legL && legR && armL && armR) {
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = damp(armL.rotation.x, -swing * 0.9, 20, dt);
      armR.rotation.x = damp(armR.rotation.x, swing * 0.9, 20, dt);
    }
    if (body) {
      // 걸을 땐 통통 + 발 디딜 때 살짝 찌그러짐, 서 있을 땐 숨쉬기
      const breathe = (1 - s) * Math.sin(t * 2.2) * 0.02;
      const squash = 1 + breathe - step * 0.06 * s;
      body.position.y = Math.abs(Math.sin(m.phase)) * 0.12 * s;
      body.scale.set(1 + (1 - squash) * 0.5, squash, 1 + (1 - squash) * 0.5);
    }

    // 6) 가만히 2초 넘게 있으면 천천히 두리번
    m.still = s < 0.05 ? m.still + dt : 0;
    if (head) {
      const look = m.still > 2 ? Math.sin(t * 0.7) * 0.4 : 0;
      head.rotation.y = damp(head.rotation.y, look, 3, dt);
    }

    // 7) 눈 깜빡임: 2.5~5.5초마다 0.12초
    if (t > m.blinkAt) {
      m.blinkUntil = t + 0.12;
      m.blinkAt = t + 2.5 + Math.random() * 3;
    }
    if (eyes) eyes.scale.y = damp(eyes.scale.y, t < m.blinkUntil ? 0.1 : 1, 40, dt);

    // 8) 카메라: 자리도, 보는 점도 살짝 늦게 따라와서 덜 딱딱하다
    const cam = state.camera;
    cam.position.lerp(cameraGoal.copy(p).add(CAMERA_OFFSET), 1 - Math.exp(-3.5 * dt));
    cameraLook.lerp(cameraGoal.set(p.x, 1.3, p.z), 1 - Math.exp(-6 * dt));
    cam.lookAt(cameraLook);
  });

  return (
    <>
      <group ref={root} position={[playerPosition.x, 0, playerPosition.z]}>
        <PlayerModel
          tiltRef={tiltRef}
          bodyRef={bodyRef}
          headRef={headRef}
          eyesRef={eyesRef}
          legLRef={legLRef}
          legRRef={legRRef}
          armLRef={armLRef}
          armRRef={armRRef}
        />
      </group>
      {showFps && <Stats />}
    </>
  );
}
