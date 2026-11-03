import Link from "next/link";
import departments from "@/data/departments.json";

// 담당: C (뼈대) · 3D 캠퍼스 화면. 3D는 src/campus/ 에서 만들고 여기서 불러온다.
// 아래 목록은 3D가 안 되는 폰을 위한 [바로 가기] — 필수로 남겨둔다.
export default function CampusPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold">캠퍼스 (3D 준비 중)</h1>
      <ul className="flex flex-col gap-2">
        {departments
          .filter((d) => d.status === "open")
          .map((d) => (
            <li key={d.id}>
              <Link className="underline" href={`/play/${d.id}`}>
                {d.name} 체험하기
              </Link>
            </li>
          ))}
      </ul>
    </main>
  );
}
