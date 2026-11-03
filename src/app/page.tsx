import Link from "next/link";

// 담당: C · 랜딩 — 닉네임 + 내 학과 선택 (기획서 4장)
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-3xl font-bold">121분의 1</h1>
      <p>세종캠, 오늘 하루 다른 과로 살아보기</p>
      <Link className="rounded bg-black px-4 py-2 text-white" href="/campus">
        시작하기
      </Link>
    </main>
  );
}
