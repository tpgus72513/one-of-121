// 답할 때마다 뜨는 한마디와, 끝나고 받는 칭호.
// 매번 같은 말이면 지루해서 몇 개 중에 무작위로 고른다.

const CORRECT = [
  "ㅇㅈ 눈치 미쳤다",
  "보안팀 스카웃 각",
  "오 좀 치는데?",
  "피싱범 울고 감",
  "이걸 맞히네",
];
const MISSED_PHISHING = [
  "헉 털렸다…",
  "그거 누르면 통장 텅장",
  "피싱범: 감사합니다^^",
  "아… 링크 눌렀어?",
];
const MISSED_REAL = [
  "멀쩡한 문자였는데ㅠ",
  "너무 의심했다ㅋㅋ",
  "이건 진짜였어",
  "괜히 씹을 뻔했네",
];

const pick = (lines: string[]) => lines[Math.floor(Math.random() * lines.length)];

export function reaction(correct: boolean, wasPhishing: boolean, streak: number) {
  if (correct) return streak >= 3 ? `${streak}연속 🔥 ${pick(CORRECT)}` : pick(CORRECT);
  return wasPhishing ? pick(MISSED_PHISHING) : pick(MISSED_REAL);
}

export function titleFor(score: number) {
  if (score >= 90) return { title: "인간 백신", sub: "피싱범들 블랙리스트에 이름 올라감" };
  if (score >= 70) return { title: "눈치 9단", sub: "웬만한 피싱은 다 걸러내는 편" };
  if (score >= 50) return { title: "반쯤 털림", sub: "링크 누르기 전에 한 번만 더 보자" };
  return { title: "피싱범 VIP 고객", sub: "…일단 링크부터 누르는 습관 버리자" };
}
