import ProfileForm from "./ProfileForm";

// 담당: C · 랜딩 — 닉네임 + 내 학과 선택 (기획서 4장)
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4 text-center">
      <div>
        <h1 className="text-4xl font-bold">121분의 1</h1>
        <p className="mt-2 text-black/70">세종캠, 오늘 하루 다른 과로 살아보기</p>
      </div>
      <ProfileForm />
      <p className="text-xs text-black/40">세종캠 학생이 만든 비공식 프로젝트</p>
    </main>
  );
}
