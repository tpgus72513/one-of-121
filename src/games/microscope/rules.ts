import sampleData from "./samples.json" with { type: "json" };

export type Shape = "rod" | "tailed" | "round" | "fiber";
export interface Particle {
  id: string;
  x: number;
  y: number;
  angle: number;
  shape: Shape;
  target: boolean;
}
export interface Sample {
  id: string;
  name: string;
  targetName: string;
  hint: string;
  targetShape: Shape;
  focus: number;
  initialFocus: number;
  particles: Particle[];
}

export const samples = sampleData as Sample[];
export const DURATION_SEC = 45;
export const HIT_RADIUS = 6.5; // 시야 크기를 100으로 정규화. 휴대폰에서도 누르기 쉽게 잡는다.
export const FOCUS_TOLERANCE = 8;
export const POINTS_PER_TARGET = 10;
export const MISS_PENALTY = 3;
export const TOTAL_TARGETS = samples.flatMap((s) => s.particles).filter((p) => p.target).length;

export interface GameState {
  phase: "ready" | "playing" | "review";
  sampleIndex: number;
  focus: number;
  foundIds: string[];
  mistakes: number;
  startedAt: number;
  timeLeft: number;
  elapsedMs: number;
  endReason: "complete" | "timeout" | null;
  feedback: string;
}

export type Action =
  | { type: "start"; now: number }
  | { type: "tick"; now: number }
  | { type: "focus"; value: number }
  | { type: "inspect"; x: number; y: number; now: number }
  | { type: "next"; now: number };

export const initialState: GameState = {
  phase: "ready",
  sampleIndex: 0,
  focus: samples[0].initialFocus,
  foundIds: [],
  mistakes: 0,
  startedAt: 0,
  timeLeft: DURATION_SEC,
  elapsedMs: 0,
  endReason: null,
  feedback: "초점을 맞추고, 안내된 모양의 균을 찾아보세요.",
};

export function isFocused(focus: number, sample: Sample) {
  return Math.abs(focus - sample.focus) <= FOCUS_TOLERANCE;
}

export function getScore(state: GameState) {
  return Math.max(
    0,
    Math.min(100, state.foundIds.length * POINTS_PER_TARGET - state.mistakes * MISS_PENALTY),
  );
}

export function isSampleComplete(state: GameState) {
  return samples[state.sampleIndex].particles
    .filter((p) => p.target)
    .every((p) => state.foundIds.includes(p.id));
}

// 실제 경과 시간으로 계산해, 다른 탭에 다녀와도 제한시간이 늘어나지 않는다.
function updateClock(state: GameState, now: number): GameState {
  const elapsedMs = Math.min(DURATION_SEC * 1000, Math.max(0, now - state.startedAt));
  const timeLeft = Math.max(0, Math.ceil(DURATION_SEC - elapsedMs / 1000));
  return {
    ...state,
    elapsedMs,
    timeLeft,
    ...(timeLeft === 0 ? { phase: "review", endReason: "timeout" } : {}),
  };
}

export function gameReducer(state: GameState, action: Action): GameState {
  if (action.type === "start") {
    return { ...initialState, phase: "playing", startedAt: action.now };
  }
  if (state.phase !== "playing") return state;
  if (action.type === "focus") {
    if (!Number.isFinite(action.value)) return state;
    return { ...state, focus: Math.max(0, Math.min(100, action.value)) };
  }

  const current = updateClock(state, action.now);
  if (current.phase !== "playing" || action.type === "tick") return current;
  const sample = samples[current.sampleIndex];

  if (action.type === "next") {
    if (!isSampleComplete(current) || current.sampleIndex === samples.length - 1) return current;
    return {
      ...current,
      sampleIndex: current.sampleIndex + 1,
      focus: samples[current.sampleIndex + 1].initialFocus,
      feedback: "새로운 시료예요. 초점을 다시 맞춰주세요!",
    };
  }

  if (!isFocused(current.focus, sample)) {
    return { ...current, feedback: "아직 흐릿해요. 초점 슬라이더를 먼저 움직여보세요." };
  }
  if (isSampleComplete(current)) return current;

  // 원형 시야 밖은 검사하지 않는다. 같은 좌표계로 마우스와 터치를 판정한다.
  if (Math.hypot(action.x - 50, action.y - 50) > 47) return current;
  const hit = sample.particles
    .map((particle) => ({
      particle,
      distance: Math.hypot(particle.x - action.x, particle.y - action.y),
    }))
    .filter(({ distance }) => distance <= HIT_RADIUS)
    .sort((a, b) => a.distance - b.distance)[0]?.particle;

  if (hit && current.foundIds.includes(hit.id)) {
    return { ...current, feedback: "이미 찾은 균이에요. 다른 곳을 관찰해볼까요?" };
  }
  if (!hit?.target) {
    return {
      ...current,
      mistakes: current.mistakes + 1,
      feedback: "다른 입자예요! 표본의 모양을 다시 확인해요. −3점",
    };
  }

  const next = {
    ...current,
    foundIds: [...current.foundIds, hit.id],
    feedback: `${sample.targetName} 발견! +10점`,
  };
  if (next.foundIds.length === TOTAL_TARGETS) {
    return { ...next, phase: "review", endReason: "complete" };
  }
  return next;
}
