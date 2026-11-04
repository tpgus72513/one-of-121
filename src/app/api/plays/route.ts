import { createClient } from "@supabase/supabase-js";
import { validatePlay } from "./validate";

// 담당: A · 점수 범위·플레이 시간 검증 후 Supabase plays 테이블에 저장 (기획서 7장)
//
// 요청 예시 (게임 실행기가 게임 끝나면 보낸다)
//   POST /api/plays
//   { "nickname": "동규", "realDept": "food-biotech", "gameDept": "ai-cybersecurity",
//     "gameId": "phishing", "score": 80, "playMs": 41200, "detail": { "correct": 8 } }
//
// 응답
//   201 { id }        저장 성공
//   400 { error }     값이 잘못됨 (어디가 잘못됐는지 한국어로)
//   413 { error }     요청이 너무 큼
//   503 { error }     서버에 Supabase 키가 없음 (.env.local 확인)
//   500 { error }     DB 저장 실패

const MAX_BODY_CHARS = 4_000;

export async function POST(request: Request) {
  // 1) 크기부터 본다. 큰 요청은 읽어서 검사할 필요도 없다
  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) {
    return Response.json({ error: "요청이 너무 커요" }, { status: 413 });
  }

  // 2) JSON 으로 읽기
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "JSON 형식이 아니에요" }, { status: 400 });
  }

  // 3) 값 검사 (validate.ts)
  const result = validatePlay(body);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  // 4) DB 연결. service role 키는 서버에서만 쓰고 절대 브라우저로 보내지 않는다
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return Response.json({ error: "서버에 Supabase 설정이 없어요" }, { status: 503 });
  }
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 5) 저장. 코드는 camelCase, DB 컬럼은 snake_case 라서 이름을 바꿔 넣는다
  const { play } = result;
  const { data, error } = await supabase
    .from("plays")
    .insert({
      nickname: play.nickname,
      real_dept: play.realDept,
      game_dept: play.gameDept,
      game_id: play.gameId,
      score: play.score,
      play_ms: play.playMs,
      detail: play.detail,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[api/plays] insert failed:", error.message);
    return Response.json({ error: "기록을 저장하지 못했어요" }, { status: 500 });
  }
  return Response.json({ id: data.id }, { status: 201 });
}
