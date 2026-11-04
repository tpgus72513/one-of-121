// 담당: C · 브라우저에 저장하는 값 (로그인이 없어서 닉네임·학과·마지막 결과를 여기 둔다)
//
// 시크릿 모드 등에서 저장소가 막혀 있어도 앱이 죽으면 안 된다 → 전부 try/catch.

export interface Profile {
  nickname: string;
  realDept: string; // 내 실제 학과 id (departments.json)
}

export interface LastResult {
  deptId: string; // 체험한 학과 id
  gameId: string;
  score: number;
  detail: Record<string, unknown> | null;
  saved: boolean; // /api/plays 저장 성공 여부 (실패해도 결과는 보여준다)
}

const PROFILE_KEY = "one-of-121:profile"; // 다음에 와도 기억 → localStorage
const RESULT_KEY = "one-of-121:last-result"; // 이번 창에서만 → sessionStorage

function read<T>(storage: () => Storage, key: string): T | null {
  try {
    const raw = storage().getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: unknown) {
  try {
    storage().setItem(key, JSON.stringify(value));
  } catch {}
}

export const loadProfile = () => read<Profile>(() => localStorage, PROFILE_KEY);
export const saveProfile = (p: Profile) => write(() => localStorage, PROFILE_KEY, p);

export const loadLastResult = () => read<LastResult>(() => sessionStorage, RESULT_KEY);
export const saveLastResult = (r: LastResult) => write(() => sessionStorage, RESULT_KEY, r);
