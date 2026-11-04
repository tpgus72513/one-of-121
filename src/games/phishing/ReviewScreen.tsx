import type { Message } from "./deck";
import { titleFor } from "./lines";
import { display, pressable, sticker } from "./theme";

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

// [해설 화면] 칭호 + 점수 + 기록, 그리고 틀린 문자마다 선배가 말로 풀어주는 해설
export default function ReviewScreen(props: ReviewScreenProps) {
  const { score, correct, total, bestStreak, aiCaught, aiTotal, wrongCards, onDone } = props;
  const { title, sub } = titleFor(score);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* 칭호 카드 */}
      <div className={`-rotate-1 rounded-2xl bg-[#FFE45C] p-4 ${sticker}`}>
        <p className="text-xs font-black text-black/60">오늘의 칭호</p>
        <div className="flex items-end justify-between gap-2">
          <h2 className={`${display.className} text-[34px] leading-tight`}>{title}</h2>
          <p className={`${display.className} text-[40px] leading-none`}>
            {score}
            <span className="text-lg">점</span>
          </p>
        </div>
        <p className="mt-1 text-sm font-bold">{sub}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="맞힌 문자" value={`${correct}/${total}`} color="bg-white" />
        <Stat label="AI 피싱 적발" value={`${aiCaught}/${aiTotal}`} color="bg-[#7CA8FF]" />
        <Stat label="최고 연속" value={`${bestStreak}`} color="bg-[#A6F04F]" />
      </div>

      {wrongCards.length > 0 ? (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <p className="text-sm font-black">보안과 선배의 한마디</p>
          <ul className="flex max-h-[36vh] flex-col gap-4 overflow-y-auto pr-1 pb-1">
            {wrongCards.map((m) => (
              <li key={m.id} className="flex flex-col gap-2">
                {/* 내가 틀린 문자 */}
                <div className="rounded-xl border-2 border-black bg-white/70 p-2.5 text-xs">
                  <span
                    className={`mr-1.5 rounded border-2 border-black px-1 font-black ${
                      m.phishing ? "bg-[#FF5C8A]" : "bg-[#A6F04F]"
                    }`}
                  >
                    {m.phishing ? "피싱" : "진짜"}
                  </span>
                  {m.ai && (
                    <span className="mr-1.5 rounded border-2 border-black bg-[#7CA8FF] px-1 font-black">
                      AI가 씀
                    </span>
                  )}
                  <span className="font-bold">{m.sender}</span>
                  <p className="mt-1 line-clamp-2 text-black/60">{m.body}</p>
                </div>
                {/* 선배 말풍선 */}
                <div className="flex items-start gap-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-black bg-black text-sm">
                    🕶️
                  </div>
                  <p className="rounded-2xl rounded-tl-sm border-2 border-black bg-white px-3 py-2 text-sm leading-relaxed font-medium">
                    {m.explain}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className={`${display.className} py-6 text-center text-2xl`}>
          전부 맞힘. 선배가 할 말이 없대
        </p>
      )}

      <button
        className={`${display.className} w-full rounded-2xl bg-black py-4 text-2xl text-[#FFE45C] ${sticker} ${pressable}`}
        onClick={onDone}
      >
        결과 보러 가기
      </button>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-xl px-1 py-2 ${color} ${sticker}`}>
      <p className={`${display.className} text-xl`}>{value}</p>
      <p className="text-[11px] font-bold">{label}</p>
    </div>
  );
}
