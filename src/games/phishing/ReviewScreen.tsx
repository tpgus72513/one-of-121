import type { Message } from "./deck";

interface ReviewScreenProps {
  score: number;
  correct: number;
  total: number;
  bestStreak: number;
  aiCaught: number;
  aiTotal: number;
  wrongCards: Message[];
  onDone: () => void;
}

// [해설 화면] 점수 링 + 기록 + 틀린 문자 해설
export default function ReviewScreen(props: ReviewScreenProps) {
  const { score, correct, total, bestStreak, aiCaught, aiTotal, wrongCards, onDone } = props;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex flex-col items-center gap-2">
        <ScoreRing score={score} />
        <p className="text-sm text-slate-300">
          {total}통 중 <b className="text-white">{correct}통</b> 정답
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center text-sm">
        <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <p className="text-xl font-black">
            {aiCaught}/{aiTotal}
          </p>
          <p className="text-xs text-slate-400">🤖 AI 피싱 적발</p>
        </div>
        <div className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <p className="text-xl font-black">{bestStreak}</p>
          <p className="text-xs text-slate-400">🔥 최고 연속 정답</p>
        </div>
      </div>

      {wrongCards.length > 0 ? (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <p className="text-sm font-bold text-slate-300">이건 이래서 틀렸어요</p>
          <ul className="flex max-h-[38vh] flex-col gap-3 overflow-y-auto pr-1">
            {wrongCards.map((m) => (
              <li key={m.id} className="rounded-2xl bg-white p-4 text-sm text-slate-900">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold text-white ${
                    m.phishing ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                >
                  {m.phishing ? "피싱 🚨" : "진짜 ✅"}
                </span>
                <span className="ml-2 font-semibold">{m.sender}</span>
                <p className="mt-2 line-clamp-2 text-slate-500">{m.body}</p>
                <p className="mt-2 rounded-xl bg-slate-100 p-2 leading-relaxed">💡 {m.explain}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="py-6 text-center text-lg font-bold">🏆 전부 맞혔어요! 보안 전문가 인정</p>
      )}

      <button
        className="w-full rounded-2xl bg-linear-to-r from-cyan-400 to-indigo-500 py-4 text-lg font-black shadow-[0_8px_30px_rgba(99,102,241,0.5)] transition active:scale-95"
        onClick={onDone}
      >
        결과 보기
      </button>
    </div>
  );
}

// 점수만큼 채워지는 동그라미. SVG 원의 테두리 길이(strokeDasharray)로 채운 정도를 그린다.
function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const color = score >= 80 ? "#34d399" : score >= 50 ? "#22d3ee" : "#fb7185";

  return (
    <div className="relative size-36">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black">{score}</span>
        <span className="text-xs text-slate-400">점</span>
      </div>
    </div>
  );
}
