import { notFound } from "next/navigation";
import departments from "@/data/departments.json";

// 담당: C · 게임 실행기 (타이머 · onFinish · registry). 게임 자체는 src/games/ 에 있다.
export function generateStaticParams() {
  return departments.filter((d) => d.status === "open").map((d) => ({ dept: d.id }));
}

export default async function PlayPage({ params }: PageProps<"/play/[dept]">) {
  const { dept } = await params;
  const department = departments.find((d) => d.id === dept);
  if (!department) notFound();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold">{department.name}</h1>
      <p>게임 실행기 준비 중 (gameId: {department.gameId})</p>
    </main>
  );
}
