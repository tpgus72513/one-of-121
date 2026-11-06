// 담당: C · 결과 카드 문구를 받아오는 부분.
//
// 문구는 B의 POST /api/result-card 가 AI로 만든다.
// 그 API가 아직 없거나(501) 실패하면, 여기 있는 기본 문구로 대신한다 → 결과 화면은 항상 뜬다.
//
// B와 맞출 형식 (⚠️ 제안 — B가 API 만들 때 다르면 여기만 고치면 된다)
//   요청  { nickname, realDept, gameDept, gameId, score, detail }
//   응답  { title: "121분의 1, ○○형 인간", body: "한두 문장 설명" }

export interface CardText {
  title: string;
  body: string;
  fromAI: boolean;
}

export interface CardRequest {
  nickname: string;
  realDept: string;
  gameDept: string;
  gameId: string;
  score: number;
  detail: Record<string, unknown> | null;
}

// 점수 구간별 기본 문구. deptName 은 체험한 학과 이름
// 학과 이름 뒤에 조사(이/가, 은/는)를 붙이지 않는다 — 받침 유무가 학과마다 달라서 틀리기 쉽다
export function fallbackCard(deptName: string, score: number): CardText {
  const short = deptName.replace(/(학과|학부|전공)$/, "");
  if (score >= 90)
    return {
      title: `121분의 1, 타고난 ${short}형 인간`,
      body: `오늘 처음 해본 거 맞아? ${deptName} 선배들이 탐내는 실력.`,
      fromAI: false,
    };
  if (score >= 70)
    return {
      title: `121분의 1, 숨은 ${short}형 인간`,
      body: `전과 상담 한 번 받아봐도 될 듯. 생각보다 ${deptName} 체질.`,
      fromAI: false,
    };
  if (score >= 40)
    return {
      title: `121분의 1, 반쯤 ${short}형 인간`,
      body: `${deptName}의 하루, 할 만은 한데 아직은 남의 과 느낌.`,
      fromAI: false,
    };
  return {
    title: `121분의 1, 지금 과가 천직형 인간`,
    body: `${deptName} 체험은 오늘로 충분. 내 과로 돌아가자.`,
    fromAI: false,
  };
}

export async function fetchCard(req: CardRequest, deptName: string): Promise<CardText> {
  try {
    const res = await fetch("/api/result-card", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
    });
    if (res.ok) {
      const data: unknown = await res.json();
      if (
        data &&
        typeof data === "object" &&
        typeof (data as CardText).title === "string" &&
        typeof (data as CardText).body === "string"
      ) {
        return { title: (data as CardText).title, body: (data as CardText).body, fromAI: true };
      }
    }
  } catch {
    // 인터넷 끊김 등 → 아래 기본 문구
  }
  return fallbackCard(deptName, req.score);
}
