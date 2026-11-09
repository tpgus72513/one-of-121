import { useRef, type MouseEvent } from "react";
import type { Particle, Sample, Shape } from "./rules";
import styles from "./microscope.module.css";

export function Microbe({ shape }: { shape: Shape }) {
  if (shape === "round") {
    return (
      <>
        <circle r="2.7" fill="#f7d271" stroke="#9b762e" strokeWidth="0.4" />
        <circle cx="-0.7" cy="-0.5" r="0.6" fill="#b78c37" />
        <circle cx="0.8" cy="1" r="0.45" fill="#b78c37" />
      </>
    );
  }
  if (shape === "fiber") {
    return (
      <path
        d="M-4 1 Q-2-4 0 0 T4-1"
        fill="none"
        stroke="#b1a3cc"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    );
  }
  const tailed = shape === "tailed";
  return (
    <>
      {tailed && (
        <path
          d="M3 0 Q5-4 7-1 T11-2 M1 1 Q3 5 6 3"
          fill="none"
          stroke="#b34c5f"
          strokeWidth="0.55"
          strokeLinecap="round"
        />
      )}
      <rect
        x="-4"
        y="-2"
        width="8"
        height="4"
        rx="2"
        fill={tailed ? "#f29aab" : "#68cba1"}
        stroke={tailed ? "#963f51" : "#23664d"}
        strokeWidth="0.5"
      />
      <path
        d="M-1.8 0h0.3 M0 0h0.3 M1.8 0h0.3"
        stroke={tailed ? "#963f51" : "#23664d"}
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </>
  );
}

interface ScopeProps {
  sample: Sample;
  blur: number;
  foundIds: string[];
  onInspect?: (x: number, y: number) => void;
}

export default function Scope({ sample, blur, foundIds, onInspect }: ScopeProps) {
  const field = useRef<HTMLDivElement>(null);

  function inspect(event: MouseEvent<HTMLButtonElement>, particle?: Particle) {
    if (!field.current || !onInspect) return;
    // 키보드는 입자의 중심을, 마우스·터치는 실제 누른 좌표를 검사한다.
    if (event.detail === 0 && particle) return onInspect(particle.x, particle.y);
    const bounds = field.current.getBoundingClientRect();
    onInspect(
      ((event.clientX - bounds.left) / bounds.width) * 100,
      ((event.clientY - bounds.top) / bounds.height) * 100,
    );
  }

  return (
    <div className={styles.scopeFrame}>
      <div className={styles.scopeTop}>
        <span>현미경 관찰</span>
        <span>{sample.name}</span>
      </div>
      <div className={styles.field} ref={field}>
        <svg
          viewBox="0 0 100 100"
          className={styles.specimen}
          role="img"
          aria-label={`${sample.name}, 원형 현미경 시야`}
        >
          <circle cx="50" cy="50" r="47" fill="#edf4d9" />
          <circle cx="50" cy="50" r="39" fill="none" stroke="#ccd9b4" strokeWidth="0.2" />
          <path d="M3 50h94 M50 3v94" stroke="#ccd9b4" strokeWidth="0.2" />
          <g style={{ filter: `blur(${blur}px)` }}>
            {sample.particles.map((p) => (
              <g
                key={p.id}
                transform={`translate(${p.x} ${p.y}) rotate(${p.angle})`}
                opacity={foundIds.includes(p.id) ? 0.3 : 1}
              >
                <Microbe shape={p.shape} />
              </g>
            ))}
          </g>
          {sample.particles
            .filter((p) => foundIds.includes(p.id))
            .map((p) => (
              <g key={p.id}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="6.2"
                  fill="none"
                  stroke="#23664d"
                  strokeWidth="0.6"
                  strokeDasharray="1.4 1"
                />
                <circle cx={p.x + 4} cy={p.y - 4.5} r="2" fill="#23664d" />
                <path
                  d={`M${p.x + 3} ${p.y - 4.5}l0.7 0.7 1.4-1.4`}
                  fill="none"
                  stroke="white"
                  strokeWidth="0.6"
                />
              </g>
            ))}
        </svg>
        {onInspect && (
          <>
            <button
              className={styles.fieldHitArea}
              type="button"
              tabIndex={-1}
              aria-label="시료의 빈 곳 검사"
              onClick={(event) => inspect(event)}
            />
            {sample.particles.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={styles.particleHitArea}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                aria-label={`입자 ${i + 1}${foundIds.includes(p.id) ? ", 발견 완료" : " 검사"}`}
                aria-pressed={foundIds.includes(p.id)}
                onClick={(event) => inspect(event, p)}
              />
            ))}
          </>
        )}
      </div>
      <div className={styles.scopeBottom}>
        <span>식품생명공학 실험실</span>
        <span>관찰 모드</span>
      </div>
    </div>
  );
}
