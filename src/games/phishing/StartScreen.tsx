import { DECK_SIZE, DURATION_SEC } from "./deck";
import { display, pressable, sticker } from "./theme";

// [시작 화면] 제목 + 조작법 + 시작 버튼
export default function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <div className="relative">
        <span
          className={`absolute -top-3 right-2 rotate-6 rounded-lg bg-[#7CA8FF] px-2 py-1 text-xs font-black ${sticker}`}
        >
          AI 피싱 섞임
        </span>
        <p className="text-sm font-black text-black/60">인공지능사이버보안학과 체험</p>
        <h2 className={`${display.className} mt-1 text-[52px] leading-[1.05]`}>
          이거
          <br />
          <span className="bg-[#FF5C8A] px-1">피싱</span>임?
        </h2>
        <p className="mt-3 font-semibold text-black/70">
          {DURATION_SEC}초 동안 문자 {DECK_SIZE}통. 우리 학교 얘기도 섞여 있음.
        </p>
      </div>

      {/* 조작법: 실제로 밀어야 하는 방향 그대로 */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`-rotate-2 rounded-2xl bg-[#FF5C8A] p-3 ${sticker}`}>
          <p className={`${display.className} text-2xl`}>← 피싱</p>
          <p className="text-xs font-bold">수상하면 왼쪽으로 휙</p>
        </div>
        <div className={`rotate-2 rounded-2xl bg-[#A6F04F] p-3 text-right ${sticker}`}>
          <p className={`${display.className} text-2xl`}>진짜 →</p>
          <p className="text-xs font-bold">멀쩡하면 오른쪽으로</p>
        </div>
      </div>

      <button
        className={`${display.className} w-full rounded-2xl bg-black py-4 text-2xl text-[#FFE45C] ${sticker} ${pressable}`}
        onClick={onStart}
      >
        털리기 전에 시작
      </button>
    </div>
  );
}
