import { useMemo, useSyncExternalStore } from "react";

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
  at: number; // 끝난 시각(ms). 결과마다 다른 값이라 결과 구분용
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
export function saveLastResult(r: LastResult) {
  write(() => sessionStorage, RESULT_KEY, r);
  window.dispatchEvent(new Event(RESULT_EVENT)); // 보고 있는 화면들에게 "결과 바뀜" 알림
}

// 결과 화면용: 마지막 결과를 "구독"해서 바뀌면 다시 그린다.
// Next 16은 결과 페이지를 숨겨 뒀다가 다시 보여주는데(Activity), 그냥 읽으면 지난 판 결과가 남는다.
// useSyncExternalStore 는 다시 보일 때 값이 바뀌었는지 확인해 줘서 항상 최신 결과가 나온다.
const RESULT_EVENT = "one-of-121:result-changed";

function subscribeResult(onChange: () => void) {
  window.addEventListener(RESULT_EVENT, onChange);
  return () => window.removeEventListener(RESULT_EVENT, onChange);
}
function resultSnapshot() {
  try {
    return sessionStorage.getItem(RESULT_KEY); // 문자열 그대로 → 같은 값이면 다시 안 그림
  } catch {
    return null;
  }
}

/** undefined = 아직 브라우저에서 확인 전(서버), null = 기록 없음 */
export function useLastResult(): LastResult | null | undefined {
  const raw = useSyncExternalStore(subscribeResult, resultSnapshot, () => undefined);
  return useMemo(() => {
    if (raw === undefined) return undefined;
    try {
      return raw ? (JSON.parse(raw) as LastResult) : null;
    } catch {
      return null;
    }
  }, [raw]);
}
