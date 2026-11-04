import ResultView from "./ResultView";

// 담당: C · 점수 + AI 결과 카드 + 이미지 저장/공유 (카드 문구 API는 B)
export default function ResultPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <ResultView />
    </main>
  );
}
