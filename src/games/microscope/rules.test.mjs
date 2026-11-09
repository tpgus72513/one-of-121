import assert from "node:assert/strict";
import test from "node:test";
import {
  DURATION_SEC,
  FOCUS_TOLERANCE,
  gameReducer,
  getScore,
  initialState,
  isFocused,
  isSampleComplete,
  samples,
  TOTAL_TARGETS,
} from "./rules.ts";

const start = () => gameReducer(initialState, { type: "start", now: 1000 });
const focus = (state) =>
  gameReducer(state, { type: "focus", value: samples[state.sampleIndex].focus });
const inspect = (state, particle, now = 2000) =>
  gameReducer(state, { type: "inspect", x: particle.x, y: particle.y, now });
const collectSample = (state) =>
  samples[state.sampleIndex].particles
    .filter((p) => p.target)
    .reduce((current, particle) => inspect(current, particle), focus(state));

test("초점이 맞아야 잡히고 허용 범위 경계에서도 선명하다", () => {
  const state = inspect(start(), samples[0].particles[0]);
  assert.equal(state.foundIds.length, 0);
  assert.equal(state.mistakes, 0);
  assert.equal(isFocused(samples[0].focus + FOCUS_TOLERANCE, samples[0]), true);
  assert.equal(isFocused(samples[0].focus + FOCUS_TOLERANCE + 1, samples[0]), false);
});

test("실제 좌표로 판정하며 같은 균은 여러 번 눌러도 한 번만 점수를 준다", () => {
  const target = samples[0].particles.find((p) => p.target);
  const first = inspect(focus(start()), { x: target.x + 1, y: target.y + 1 });
  const repeated = inspect(first, target);
  assert.deepEqual(repeated.foundIds, [target.id]);
  assert.equal(getScore(repeated), 10);
  assert.equal(repeated.mistakes, 0);
});

test("다른 입자는 감점되고 0점 아래로 내려가지 않는다", () => {
  const wrong = samples[0].particles.find((p) => !p.target);
  const state = inspect(inspect(focus(start()), samples[0].particles[0]), wrong);
  assert.equal(getScore(state), 7);
  let misses = state;
  for (let i = 0; i < 10; i++) misses = inspect(misses, wrong);
  assert.equal(getScore(misses), 0);
});

test("시야 밖 클릭과 진행 전·종료 후의 입력은 기록을 바꾸지 않는다", () => {
  assert.equal(inspect(initialState, samples[0].particles[0]), initialState);
  const outside = inspect(focus(start()), { x: 0, y: 0 });
  assert.equal(outside.mistakes, 0);
  const ended = gameReducer(outside, { type: "tick", now: 46_000 });
  assert.equal(inspect(ended, samples[0].particles[0], 47_000), ended);
});

test("시료를 모두 찾기 전에는 다음으로 못 가고, 다음 시료에서 시간은 초기화되지 않는다", () => {
  const premature = gameReducer(start(), { type: "next", now: 2000 });
  assert.equal(premature.sampleIndex, 0);
  const first = collectSample(premature);
  assert.equal(isSampleComplete(first), true);
  const second = gameReducer(first, { type: "next", now: 11_000 });
  assert.equal(second.sampleIndex, 1);
  assert.equal(second.focus, samples[1].initialFocus);
  assert.equal(second.timeLeft, 35);
  assert.equal(second.foundIds.length, 5);
});

test("두 시료를 모두 찾으면 100점으로 끝나고 재시작하면 이전 기록을 지운다", () => {
  const first = collectSample(start());
  const second = gameReducer(first, { type: "next", now: 2000 });
  const ended = collectSample(second);
  assert.equal(ended.phase, "review");
  assert.equal(ended.endReason, "complete");
  assert.equal(ended.foundIds.length, TOTAL_TARGETS);
  assert.equal(getScore(ended), 100);
  const restarted = gameReducer(ended, { type: "start", now: 90_000 });
  assert.deepEqual(restarted.foundIds, []);
  assert.equal(restarted.timeLeft, DURATION_SEC);
  assert.equal(restarted.mistakes, 0);
  assert.equal(restarted.sampleIndex, 0);
});

test("탭 복귀 시 실제 경과 시간으로 종료하며 시간 경계의 클릭도 정답 처리하지 않는다", () => {
  const focused = focus(start());
  const ended = gameReducer(focused, { type: "tick", now: 120_000 });
  assert.equal(ended.timeLeft, 0);
  assert.equal(ended.elapsedMs, DURATION_SEC * 1000);
  assert.equal(ended.endReason, "timeout");
  const lateClick = inspect(focused, samples[0].particles[0], 46_000);
  assert.equal(lateClick.phase, "review");
  assert.equal(lateClick.foundIds.length, 0);
});

test("시료 데이터의 id는 고유하고 입자와 클릭 영역은 원형 시야 안에 있다", () => {
  const particles = samples.flatMap((s) => s.particles);
  assert.equal(new Set(particles.map((p) => p.id)).size, particles.length);
  assert.equal(TOTAL_TARGETS, 10);
  for (const particle of particles) {
    assert.ok(Math.hypot(particle.x - 50, particle.y - 50) < 40);
  }
});
