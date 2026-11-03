import allMessages from "./messages.json";

// 게임 규칙에 쓰는 숫자들. 바꾸고 싶으면 여기만 고치면 된다.
export const DURATION_SEC = 45; // 제한시간. registry.ts 의 durationSec 과 맞춘다
export const DECK_SIZE = 10; // 한 판에 나오는 문자 수
const PHISHING_COUNT = 6; // 그중 피싱 문자 수 (나머지 4장은 진짜)

// messages.json 한 칸의 모양을 그대로 타입으로 쓴다.
// → { id, sender, body, phishing, ai, explain }
export type Message = (typeof allMessages)[number];

// 배열 순서를 무작위로 섞는다. 원본은 건드리지 않고 복사본을 섞는다.
function shuffle(list: Message[]): Message[] {
  return [...list].sort(() => Math.random() - 0.5);
}

// 한 판에 쓸 카드 10장 뽑기: 피싱 6장 + 진짜 4장 → 다시 섞기
export function makeDeck(): Message[] {
  const phishing = shuffle(allMessages.filter((m) => m.phishing)).slice(0, PHISHING_COUNT);
  const real = shuffle(allMessages.filter((m) => !m.phishing)).slice(0, DECK_SIZE - PHISHING_COUNT);
  return shuffle([...phishing, ...real]);
}
