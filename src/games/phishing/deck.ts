import allMessages from "./messages.json";

// 게임 규칙에 쓰는 숫자들. 바꾸고 싶으면 여기만 고치면 된다.
export const DURATION_SEC = 45; // 제한시간. registry.ts 의 durationSec 과 맞춘다
export const DECK_SIZE = 10; // 한 판에 나오는 문자 수
const PHISHING_COUNT = 6; // 그중 피싱 문자 수 (나머지는 진짜)

// messages.json 한 칸의 모양을 그대로 타입으로 쓴다.
// → { id, sender, body, phishing, ai, school, explain }
export type Message = (typeof allMessages)[number];

// 최근에 본 문자 id 를 브라우저에 기억해 두고, 다음 판엔 안 본 문자부터 뽑는다.
// (같은 과를 여러 번 해도 문제가 덜 겹치게)
const SEEN_KEY = "phishing-seen-ids";
const SEEN_LIMIT = 40; // 이만큼만 기억. 넘치면 오래된 것부터 잊어서 다시 나올 수 있게

function loadSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
  } catch {
    return []; // 시크릿 모드 등에서 localStorage 가 막혀 있어도 게임은 돼야 한다
  }
}

function saveSeen(ids: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-SEEN_LIMIT)));
  } catch {}
}

// 배열 순서를 무작위로 섞는다. 원본은 건드리지 않고 복사본을 섞는다.
// Fisher–Yates: 뒤에서부터 한 칸씩, 아직 안 정한 칸 중 하나와 자리를 바꾼다.
// sort(() => Math.random() - 0.5) 는 앞쪽 카드가 덜 섞이는 치우침이 있어서 바꿨다 (리뷰 반영)
function shuffle(list: Message[]): Message[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// 한 판에 쓸 카드 뽑기.
// 피싱 6장(세종캠 2장 + AI 1장 꼭 포함) + 진짜 4장(세종캠 2장 꼭 포함) → 다시 섞기
export function makeDeck(): Message[] {
  const seen = loadSeen();
  const picked: Message[] = [];

  // 조건에 맞는 문자 중 n장을, 안 본 것 먼저 골라서 picked 에 넣는다
  function take(match: (m: Message) => boolean, n: number) {
    const pool = allMessages.filter((m) => match(m) && !picked.includes(m));
    const fresh = shuffle(pool.filter((m) => !seen.includes(m.id)));
    const old = shuffle(pool.filter((m) => seen.includes(m.id)));
    picked.push(...[...fresh, ...old].slice(0, n));
  }

  take((m) => m.phishing && m.school, 2);
  take((m) => m.phishing && m.ai, 1);
  take((m) => m.phishing, PHISHING_COUNT - 3);
  take((m) => !m.phishing && m.school, 2);
  take((m) => !m.phishing, DECK_SIZE - PHISHING_COUNT - 2);

  saveSeen([...seen.filter((id) => !picked.some((m) => m.id === id)), ...picked.map((m) => m.id)]);
  return shuffle(picked);
}
