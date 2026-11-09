"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { GameProps } from "../types";
import Scope, { Microbe } from "./Scope";
import {
  DURATION_SEC,
  gameReducer,
  getScore,
  initialState,
  isFocused,
  isSampleComplete,
  MISS_PENALTY,
  POINTS_PER_TARGET,
  samples,
  TOTAL_TARGETS,
} from "./rules";
import styles from "./microscope.module.css";

// 담당: B · 식품생명공학과. 게임 진행과 기록만 담당하며 서버·3D에 의존하지 않는다.
export default function MicroscopeGame({ onFinish }: GameProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [submitted, setSubmitted] = useState(false);
  const finished = useRef(false);
  const sample = samples[state.sampleIndex];
  const focused = isFocused(state.focus, sample);
  const sharpness = Math.max(0, 100 - Math.abs(state.focus - sample.focus) * 3);
  const foundInSample = sample.particles.filter((p) => state.foundIds.includes(p.id)).length;
  const sampleTargets = sample.particles.filter((p) => p.target).length;
  const score = getScore(state);

  useEffect(() => {
    if (state.phase !== "playing") return;
    const tick = () => dispatch({ type: "tick", now: performance.now() });
    const timer = window.setInterval(tick, 100);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [state.phase]);

  function start() {
    finished.current = false;
    setSubmitted(false);
    dispatch({ type: "start", now: performance.now() });
  }

  function finish() {
    if (finished.current || state.phase !== "review") return;
    finished.current = true;
    setSubmitted(true);
    onFinish(score, {
      correct: state.foundIds.length,
      total: TOTAL_TARGETS,
      mistakes: state.mistakes,
      foundIds: state.foundIds,
      elapsedMs: Math.round(state.elapsedMs),
      timeLeft: state.timeLeft,
      endReason: state.endReason,
      completedSamples: samples.filter((s) =>
        s.particles.filter((p) => p.target).every((p) => state.foundIds.includes(p.id)),
      ).length,
    });
  }

  return (
    <section className={styles.game} aria-label="식중독균 찾기 게임">
      <header className={styles.header}>
        <span className={styles.labLabel}>
          <span className={styles.statusDot} /> FOOD BIO LAB
        </span>
        <span className={styles.smallLabel}>121분의 1 · 식품생명공학과</span>
      </header>

      {state.phase === "ready" && (
        <div className={styles.intro}>
          <div className={styles.introCopy}>
            <span className={styles.tag}>오늘의 임무: 식품 속 미생물 관찰</span>
            <h2 className={styles.title}>
              딱 걸렸어,
              <br />
              <span>식중독균!</span>
            </h2>
            <p className={styles.description}>
              흐릿한 시료 속에 무언가 숨어 있어요.
              <br />
              초점을 맞추고, 수상한 균을 찾아주세요.
            </p>
            <ol className={styles.steps}>
              <li>
                <b>01</b>
                <span>
                  슬라이더를 움직여 <strong>초점 맞추기</strong>
                </span>
              </li>
              <li>
                <b>02</b>
                <span>
                  표본과 같은 균을 <strong>클릭하거나 터치</strong>
                </span>
              </li>
              <li>
                <b>03</b>
                <span>
                  두 시료에서 총 <strong>{TOTAL_TARGETS}마리 찾기</strong>
                </span>
              </li>
            </ol>
            <div className={styles.ruleChips}>
              <span>{DURATION_SEC}초</span>
              <span>100점 만점</span>
              <span>오답 −{MISS_PENALTY}점</span>
            </div>
            <button type="button" className={styles.primaryButton} onClick={start}>
              관찰 시작하기 <span aria-hidden="true">↗</span>
            </button>
          </div>
          <div className={styles.introVisual}>
            <div className={styles.floatingNote}>작은 단서도 놓치지 마!</div>
            <Scope sample={samples[0]} blur={0.2} foundIds={[]} />
            <p className={styles.caption}>눈 크게 뜨고, 연구원 모드 ON.</p>
          </div>
        </div>
      )}

      {state.phase === "playing" && (
        <>
          <div className={styles.playHeading}>
            <div>
              <p className={styles.eyebrow}>미생물 관찰 일지</p>
              <h2>숨어 있는 균을 찾아라!</h2>
            </div>
            <div
              className={styles.timer}
              data-urgent={state.timeLeft <= 10}
              role="timer"
              aria-label={`남은 시간 ${state.timeLeft}초`}
            >
              <span>남은 시간</span>
              <strong>
                {state.timeLeft}
                <small>초</small>
              </strong>
            </div>
          </div>
          <div
            className={styles.timeTrack}
            role="progressbar"
            aria-label="남은 시간"
            aria-valuemin={0}
            aria-valuemax={DURATION_SEC}
            aria-valuenow={state.timeLeft}
          >
            <div style={{ width: `${(state.timeLeft / DURATION_SEC) * 100}%` }} />
          </div>
          <div className={styles.playGrid}>
            <div className={styles.observation}>
              <Scope
                sample={sample}
                blur={Math.min(1.5, Math.abs(state.focus - sample.focus) / 32)}
                foundIds={state.foundIds}
                onInspect={(x, y) => dispatch({ type: "inspect", x, y, now: performance.now() })}
              />
              <p className={styles.feedback} role="status" aria-live="polite">
                {isSampleComplete(state)
                  ? "이 시료의 균을 모두 찾았어요! 다음 시료로 이동해요."
                  : state.feedback}
              </p>
            </div>
            <div className={styles.controls}>
              <div className={styles.targetCard}>
                <div className={styles.cardHeading}>
                  <span>찾아야 할 균</span>
                  <span>
                    {state.sampleIndex + 1} / {samples.length}
                  </span>
                </div>
                <div className={styles.targetIdentity}>
                  <svg viewBox="-13 -13 26 26" aria-hidden="true">
                    <Microbe shape={sample.targetShape} />
                  </svg>
                  <div>
                    <h3>{sample.targetName}</h3>
                    <p>
                      {sample.name}에서 {sampleTargets}마리
                    </p>
                  </div>
                </div>
                <p className={styles.hint}>{sample.hint}</p>
                <div
                  className={styles.collected}
                  aria-label={`현재 시료 ${sampleTargets}마리 중 ${foundInSample}마리 발견`}
                >
                  {Array.from({ length: sampleTargets }, (_, i) => (
                    <span key={i} data-found={i < foundInSample} aria-hidden="true">
                      {i < foundInSample ? "✓" : "·"}
                    </span>
                  ))}
                  <strong>
                    {foundInSample}/{sampleTargets}
                  </strong>
                </div>
              </div>
              <div className={styles.focusCard}>
                <div className={styles.cardHeading}>
                  <label htmlFor="microscope-focus">초점 조절</label>
                  <span className={styles.focusBadge} data-focused={focused}>
                    {focused ? "선명해요!" : sharpness >= 45 ? "거의 맞았어요" : "흐릿해요"}
                  </span>
                </div>
                <input
                  id="microscope-focus"
                  className={styles.focusSlider}
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={state.focus}
                  onChange={(event) =>
                    dispatch({ type: "focus", value: Number(event.target.value) })
                  }
                  aria-valuetext={`${state.focus}, ${focused ? "선명함" : "초점을 더 맞춰주세요"}`}
                />
                <div className={styles.sliderLabels}>
                  <span>가까이</span>
                  <span>멀리</span>
                </div>
                <p>시료가 가장 선명해지는 지점을 찾아요.</p>
              </div>
              <div className={styles.scoreRow}>
                <span>
                  발견{" "}
                  <b>
                    {state.foundIds.length}/{TOTAL_TARGETS}
                  </b>
                </span>
                <span>
                  현재 점수{" "}
                  <b>
                    {score}
                    <small>점</small>
                  </b>
                </span>
              </div>
              {state.sampleIndex < samples.length - 1 && (
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={!isSampleComplete(state)}
                  onClick={() => dispatch({ type: "next", now: performance.now() })}
                >
                  다음 시료 관찰하기 <span aria-hidden="true">→</span>
                </button>
              )}
              <p className={styles.tip}>
                정답 +{POINTS_PER_TARGET}점 · 다른 입자 −{MISS_PENALTY}점<br />
                이미 찾은 균은 다시 눌러도 괜찮아요.
              </p>
            </div>
          </div>
        </>
      )}

      {state.phase === "review" && (
        <div className={styles.review}>
          <span className={styles.tag}>관찰 일지 작성 완료</span>
          <h2>{state.endReason === "complete" ? "전부 찾았다!" : "오늘의 관찰 끝!"}</h2>
          <p className={styles.description}>
            {state.endReason === "complete"
              ? "작은 단서도 놓치지 않는 연구원이네요."
              : "시간이 다 됐어요. 발견한 균을 함께 확인해요."}
          </p>
          <div className={styles.finalScore}>
            <strong>{score}</strong>
            <span>/ 100점</span>
          </div>
          <dl className={styles.summary}>
            <div>
              <dt>발견한 균</dt>
              <dd>
                {state.foundIds.length} / {TOTAL_TARGETS}
              </dd>
            </div>
            <div>
              <dt>다른 입자 선택</dt>
              <dd>{state.mistakes}회</dd>
            </div>
            <div>
              <dt>관찰 시간</dt>
              <dd>{(state.elapsedMs / 1000).toFixed(1)}초</dd>
            </div>
          </dl>
          <div className={styles.sampleResults}>
            {samples.map((s) => (
              <div key={s.id}>
                <svg viewBox="-13 -10 26 20" aria-hidden="true">
                  <Microbe shape={s.targetShape} />
                </svg>
                <span>
                  {s.name} · {s.targetName}
                </span>
                <b>
                  {s.particles.filter((p) => p.target && state.foundIds.includes(p.id)).length} /{" "}
                  {s.particles.filter((p) => p.target).length}
                </b>
              </div>
            ))}
          </div>
          <p className={styles.tip}>
            발견 수 × {POINTS_PER_TARGET}점 − 오답 수 × {MISS_PENALTY}점 (최저 0점)
          </p>
          <div className={styles.reviewActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={start}
              disabled={submitted}
            >
              다시 관찰하기
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={finish}
              disabled={submitted}
            >
              {submitted ? "체험 완료" : "체험 마치기"} <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        게임 속 균의 색과 형태는 구별하기 쉽게 단순화했어요.
      </footer>
    </section>
  );
}
