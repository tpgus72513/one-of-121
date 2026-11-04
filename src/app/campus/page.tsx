import Link from "next/link";
import CampusCanvas from "@/campus/CampusCanvas";
import departments from "@/data/departments.json";

// 담당: C · 3D 캠퍼스 화면. 3D는 src/campus/ 에서 만들고 여기서 불러온다.
// 아래 목록은 3D가 안 되는 폰을 위한 [바로 가기] — 필수로 남겨둔다.
export default function CampusPage() {
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {/* 화면 전체 = 3D */}
      <div className="absolute inset-0">
        <CampusCanvas />
      </div>

      {/* 3D 위에 떠 있는 [바로 가기] */}
      <nav className="absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-2 p-4">
        {departments
          .filter((d) => d.status === "open")
          .map((d) => (
            <Link
              key={d.id}
              className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold shadow"
              href={`/play/${d.id}`}
            >
              {d.name} 바로 가기
            </Link>
          ))}
      </nav>
    </main>
  );
}
