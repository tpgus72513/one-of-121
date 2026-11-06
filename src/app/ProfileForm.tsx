"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import departments from "@/data/departments.json";
import { loadProfile, saveProfile } from "@/lib/storage";
import { useMounted } from "@/lib/useMounted";

// 담당: C · 랜딩의 닉네임 + 내 학과 입력. 로그인 없이 브라우저에 저장한다.

const NICKNAME_MAX = 12; // /api/plays 검사와 같은 숫자

// 단과대별로 묶어서 드롭다운에 보여준다 (36개를 한 줄로 늘어놓으면 찾기 힘듦)
const colleges = [...new Set(departments.map((d) => d.college))];

export default function ProfileForm() {
  // 저장된 값을 미리 채우려면 브라우저에서만 그려야 한다 (서버엔 localStorage 가 없음)
  const mounted = useMounted();
  if (!mounted) return <div className="h-[184px]" />; // 자리만 잡아서 화면이 덜 튀게
  return <Form />;
}

function Form() {
  const router = useRouter();
  const saved = loadProfile();
  const [nickname, setNickname] = useState(saved?.nickname ?? "");
  const [realDept, setRealDept] = useState(saved?.realDept ?? "");

  const trimmed = nickname.trim();
  const valid = trimmed.length >= 1 && trimmed.length <= NICKNAME_MAX && realDept !== "";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    saveProfile({ nickname: trimmed, realDept });
    router.push("/campus");
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3 text-left">
      <label className="flex flex-col gap-1 text-sm font-semibold">
        닉네임
        <input
          className="rounded-lg border border-black/20 px-3 py-2.5 text-base font-normal"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={NICKNAME_MAX}
          placeholder={`${NICKNAME_MAX}자 이내`}
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        내 학과
        <select
          className="rounded-lg border border-black/20 bg-white px-3 py-2.5 text-base font-normal"
          value={realDept}
          onChange={(e) => setRealDept(e.target.value)}
          required
        >
          <option value="" disabled>
            골라 주세요
          </option>
          {colleges.map((college) => (
            <optgroup key={college} label={college}>
              {departments
                .filter((d) => d.college === college)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>
      <button
        className="mt-1 rounded-full bg-black py-3 font-semibold text-white disabled:opacity-40"
        disabled={!valid}
      >
        캠퍼스로 들어가기
      </button>
    </form>
  );
}
