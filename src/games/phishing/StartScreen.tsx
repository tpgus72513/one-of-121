import { DECK_SIZE, DURATION_SEC } from "./deck";

// [시작 화면] 게임 설명 + 시작 버튼
export default function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      {/* 방패 아이콘 + 뒤에서 퍼지는 빛 */}
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-cyan-400/20" />
        <div className="relative flex size-24 items-center justify-center rounded-full bg-linear-to-br from-cyan-400 to-indigo-500 text-5xl shadow-[0_0_40px_rgba(34,211,238,0.5)]">
          🛡️
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold tracking-[0.3em] text-cyan-300">AI CYBERSECURITY</p>
        <h2 className="mt-2 text-3xl font-black">피싱 문자를 가려내라</h2>
        <p className="mt-2 text-sm text-slate-300">
          문자 {DECK_SIZE}통 · 제한시간 {DURATION_SEC}초
        </p>
      </div>

      {/* 조작법 */}
      <div className="grid w-full grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-rose-500/15 p-4 ring-1 ring-rose-400/30">
          <p className="text-2xl">👈</p>
          <p className="mt-1 font-bold text-rose-300">피싱이면 왼쪽</p>
        </div>
        <div className="rounded-2xl bg-emerald-500/15 p-4 ring-1 ring-emerald-400/30">
          <p className="text-2xl">👉</p>
          <p className="mt-1 font-bold text-emerald-300">진짜면 오른쪽</p>
        </div>
      </div>
      <p className="text-xs text-slate-400">🤖 AI가 쓴, 사람보다 그럴듯한 피싱도 섞여 있어요</p>

      <button
        className="w-full rounded-2xl bg-linear-to-r from-cyan-400 to-indigo-500 py-4 text-lg font-black shadow-[0_8px_30px_rgba(99,102,241,0.5)] transition active:scale-95"
        onClick={onStart}
      >
        시작하기
      </button>
    </div>
  );
}
