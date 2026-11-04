import departments from "@/data/departments.json";

// 담당: A · /api/plays 로 들어온 값 검사.
// 브라우저가 보낸 값은 누구나 조작할 수 있다고 보고, 저장 전에 하나하나 확인한다.

export interface PlayInput {
  nickname: string;
  realDept: string; // 내 실제 학과 id
  gameDept: string; // 체험한 학과 id
  gameId: string; // 그 학과 게임 id ('phishing' 등)
  score: number; // 0~100 정수
  playMs: number; // 게임 시작~끝 걸린 시간(ms)
  detail: Record<string, unknown> | null;
}

type Result = { ok: true; play: PlayInput } | { ok: false; error: string };

const NICKNAME_MAX = 12;
const MIN_PLAY_MS = 5_000; // 5초 안에 끝났다면 사람이 실제로 한 게 아니다
const MAX_PLAY_MS = 10 * 60_000; // 10분이 넘으면 창을 켜두고 딴짓한 기록
const MAX_DETAIL_CHARS = 2_000; // 세부기록이 쓸데없이 크면 거절

const fail = (error: string): Result => ({ ok: false, error });

export function validatePlay(body: unknown): Result {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return fail("요청 형식이 잘못됐어요");
  }
  const b = body as Record<string, unknown>;

  // 닉네임: 앞뒤 공백 빼고 1~12자, 줄바꿈 같은 제어문자 금지
  if (typeof b.nickname !== "string") return fail("닉네임이 없어요");
  const nickname = b.nickname.trim();
  if (nickname.length < 1 || nickname.length > NICKNAME_MAX) {
    return fail(`닉네임은 1~${NICKNAME_MAX}자로 해주세요`);
  }
  if (/\p{Cc}/u.test(nickname)) return fail("닉네임에 쓸 수 없는 문자가 있어요");

  // 학과: departments.json 목록에 있는 id 만
  const realDept = departments.find((d) => d.id === b.realDept);
  if (!realDept) return fail("내 학과가 목록에 없어요");

  // 체험한 학과: 게임이 열려 있는 과여야 하고, 게임 id 도 그 과 게임과 같아야 한다
  const gameDept = departments.find((d) => d.id === b.gameDept);
  if (!gameDept || gameDept.status !== "open" || !gameDept.gameId) {
    return fail("체험할 수 없는 학과예요");
  }
  if (b.gameId !== gameDept.gameId) return fail("학과와 게임이 맞지 않아요");

  // 점수: 0~100 정수 (게임 공통 규칙)
  if (typeof b.score !== "number" || !Number.isInteger(b.score) || b.score < 0 || b.score > 100) {
    return fail("점수는 0~100 사이 정수여야 해요");
  }

  // 플레이 시간: 너무 빠르거나 너무 긴 기록은 거른다
  if (typeof b.playMs !== "number" || !Number.isInteger(b.playMs)) {
    return fail("플레이 시간이 없어요");
  }
  if (b.playMs < MIN_PLAY_MS) return fail("너무 빨리 끝난 기록이에요");
  if (b.playMs > MAX_PLAY_MS) return fail("플레이 시간이 너무 길어요");

  // 세부기록: 없어도 되고, 있으면 객체 + 크기 제한
  let detail: Record<string, unknown> | null = null;
  if (b.detail !== undefined && b.detail !== null) {
    if (typeof b.detail !== "object" || Array.isArray(b.detail)) {
      return fail("세부기록 형식이 잘못됐어요");
    }
    if (JSON.stringify(b.detail).length > MAX_DETAIL_CHARS) return fail("세부기록이 너무 커요");
    detail = b.detail as Record<string, unknown>;
  }

  return {
    ok: true,
    play: {
      nickname,
      realDept: realDept.id,
      gameDept: gameDept.id,
      gameId: gameDept.gameId,
      score: b.score,
      playMs: b.playMs,
      detail,
    },
  };
}
