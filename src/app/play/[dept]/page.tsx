import Link from "next/link";
import { notFound } from "next/navigation";
import departments from "@/data/departments.json";
import GameRunner from "./GameRunner";

// 담당: C · /play/학과id → 그 과의 게임 실행. 실제 진행은 GameRunner.tsx
export function generateStaticParams() {
  return departments.filter((d) => d.status === "open").map((d) => ({ dept: d.id }));
}

export default async function PlayPage({ params }: PageProps<"/play/[dept]">) {
  const { dept } = await params;
  const department = departments.find((d) => d.id === dept);
  if (!department) notFound();

  // "준비 중" 학과는 주소를 직접 쳐서 들어와도 게임을 못 한다
  if (department.status !== "open" || !department.gameId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">{department.name}</h1>
        <p>아직 준비 중인 학과예요.</p>
        <Link className="underline" href="/campus">
          캠퍼스로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-3 px-4 py-6">
      <p className="text-sm font-semibold text-black/60">오늘 하루, {department.name}</p>
      <GameRunner deptId={department.id} gameId={department.gameId} />
    </main>
  );
}
