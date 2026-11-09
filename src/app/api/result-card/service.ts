import departments from "../../../data/departments.json" with { type: "json" };

export const DEFAULT_MODEL = "gpt-5.4-mini";
export const MAX_BODY_BYTES = 8_192;
export const TIMEOUT_MS = 8_000;

export interface CardText {
  title: string;
  description: string;
  keywords: string[];
}

export interface ResultCardResponse {
  card: CardText;
  source: "ai" | "fallback";
  gameDept: string;
  score: number;
}

interface CardInput {
  gameDept: string;
  gameId: string;
  score: number;
  detail: Record<string, number>;
}

interface ServiceOptions {
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

const HEADERS = { "Cache-Control": "no-store" };
const SUMMARY_LIMITS: Record<string, number> = {
  correct: 1_000,
  total: 1_000,
  answered: 1_000,
  mistakes: 1_000,
  bestStreak: 1_000,
  aiPhishingCaught: 1_000,
  aiPhishingTotal: 1_000,
  timeLeft: 60,
  elapsedMs: 600_000,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateInput(
  body: unknown,
): { ok: true; input: CardInput } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  if (!isRecord(body)) return fail("요청 형식이 잘못됐어요");
  const department = departments.find((item) => item.id === body.gameDept);
  if (!department || department.status !== "open" || !department.gameId) {
    return fail("체험할 수 없는 학과예요");
  }
  if (body.gameId !== department.gameId) return fail("학과와 게임이 맞지 않아요");
  if (
    typeof body.score !== "number" ||
    !Number.isInteger(body.score) ||
    body.score < 0 ||
    body.score > 100
  ) {
    return fail("점수는 0~100 사이 정수여야 해요");
  }
  if (body.detail !== undefined && body.detail !== null && !isRecord(body.detail)) {
    return fail("세부기록 형식이 잘못됐어요");
  }

  // 자유 입력 문장·닉네임·문제 원문은 AI에 보내지 않는다. 게임의 숫자 기록만 선택한다.
  const detail: Record<string, number> = {};
  if (isRecord(body.detail)) {
    for (const [key, max] of Object.entries(SUMMARY_LIMITS)) {
      const value = body.detail[key];
      if (value === undefined) continue;
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > max) {
        return fail(`세부기록 ${key} 값이 잘못됐어요`);
      }
      detail[key] = value;
    }
  }
  if (detail.correct !== undefined && detail.total !== undefined && detail.correct > detail.total) {
    return fail("정답 수가 전체 문제 수보다 많아요");
  }
  if (
    detail.aiPhishingCaught !== undefined &&
    detail.aiPhishingTotal !== undefined &&
    detail.aiPhishingCaught > detail.aiPhishingTotal
  ) {
    return fail("찾은 AI 피싱 수가 전체보다 많아요");
  }
  return {
    ok: true,
    input: { gameDept: department.id, gameId: department.gameId, score: body.score, detail },
  };
}

export function makeFallbackCard(gameId: string, score: number): CardText {
  const tier = score >= 80 ? 0 : score >= 50 ? 1 : 2;
  const food: CardText[] = [
    {
      title: "121분의 1, 정밀 관찰형 인간",
      description:
        "작은 단서까지 놓치지 않는 오늘의 연구원! 시료 속 차이를 차근차근 구별해냈어요. 다음 관찰에서도 이 집중력을 발휘해봐요.",
      keywords: ["관찰력", "집중력", "꼼꼼함"],
    },
    {
      title: "121분의 1, 끈기 있는 탐구형 인간",
      description:
        "흐릿한 시료 속에서도 단서를 찾아가는 탐구원! 초점과 표본을 번갈아 확인하며 감을 잡았어요. 다음엔 조금 더 천천히 모양을 비교해봐요.",
      keywords: ["탐구심", "끈기", "성장"],
    },
    {
      title: "121분의 1, 호기심 새싹형 인간",
      description:
        "새로운 실험실에 용감하게 첫발을 내디뎠어요! 먼저 초점을 선명하게 맞추고 안내된 모양을 찾아보세요. 다음 관찰이 더 기대되는 연구원이에요.",
      keywords: ["호기심", "도전", "가능성"],
    },
  ];
  const security: CardText[] = [
    {
      title: "121분의 1, 보안 레이더형 인간",
      description:
        "그럴듯한 문자 속 수상한 단서를 포착했어요! 급한 요청에도 한 번 더 확인하는 오늘의 보안 탐정. 다음 체험에서도 꼼꼼한 판단을 이어가봐요.",
      keywords: ["판별력", "신중함", "집중력"],
    },
    {
      title: "121분의 1, 의심 탐정형 인간",
      description:
        "진짜와 피싱 사이에서 단서를 차근차근 모았어요! 놓친 문자는 해설과 함께 돌아보면 좋아요. 한 번 더 의심하는 습관이 다음 플레이의 힌트예요.",
      keywords: ["관찰력", "신중함", "탐구심"],
    },
    {
      title: "121분의 1, 도전하는 탐색형 인간",
      description:
        "낯선 보안 미션에 도전한 오늘의 탐색가! 문자의 요청과 수상한 연결 주소를 천천히 비교해보세요. 해설에서 얻은 단서로 한 번 더 도전해봐요.",
      keywords: ["호기심", "도전", "성장"],
    },
  ];
  return (gameId === "microscope" ? food : security)[tier];
}

export const CARD_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    keywords: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
  },
  required: ["title", "description", "keywords"],
  additionalProperties: false,
};

const INSTRUCTIONS = [
  "너는 대학 학과 체험 게임 '121분의 1'의 한국어 결과 카드 작가다.",
  "제공되는 학과·게임·점수·숫자 기록만 근거로, 짧고 친근한 재미용 칭호를 만든다.",
  "title은 반드시 '121분의 1, ○○형 인간' 형태이며 공백 포함 40자 이내다.",
  "description은 20~140자의 한국어 2~3문장이다. 점수를 다시 쓰거나 기록에 없는 성과·순위를 만들지 않는다.",
  "keywords는 서로 다른 한국어 키워드 3개이며 각각 12자 이내다.",
  "점수 80 이상은 관찰·판별의 장점, 50~79는 탐구와 끈기, 49 이하는 호기심과 다음 도전을 긍정적으로 표현한다.",
  "낮은 점수를 조롱하거나 지능·성격·진로 적성을 단정하지 않는다. 실제 의료·보안 자격이나 능력을 보증하지 않는다.",
  "게임과 무관한 조언, 개인정보, URL, HTML, 마크다운, 광고는 쓰지 않는다.",
].join("\n");

function plainText(value: unknown, max: number) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= max &&
    !/[\p{Cc}<>]/u.test(value) &&
    !/https?:\/\/|www\./i.test(value)
  );
}

export function parseAIResponse(body: unknown): CardText | null {
  if (!isRecord(body) || body.status !== "completed" || !Array.isArray(body.output)) return null;
  let text = "";
  for (const item of body.output) {
    if (
      !isRecord(item) ||
      item.type !== "message" ||
      item.role !== "assistant" ||
      !Array.isArray(item.content)
    )
      continue;
    for (const part of item.content) {
      if (!isRecord(part)) continue;
      if (part.type === "refusal") return null;
      if (part.type === "output_text" && typeof part.text === "string") text += part.text;
      if (text.length > 4_000) return null;
    }
  }
  try {
    const card: unknown = JSON.parse(text);
    if (!isRecord(card) || !plainText(card.title, 40) || !plainText(card.description, 180))
      return null;
    const title = (card.title as string).trim();
    const description = (card.description as string).trim();
    if (
      !/^121분의 1, .+형 인간$/u.test(title) ||
      description.length < 10 ||
      !/[가-힣]/u.test(description)
    )
      return null;
    if (
      !Array.isArray(card.keywords) ||
      card.keywords.length !== 3 ||
      !card.keywords.every((keyword) => plainText(keyword, 12))
    )
      return null;
    const keywords = card.keywords.map((keyword) => (keyword as string).trim());
    if (new Set(keywords).size !== 3) return null;
    return { title, description, keywords };
  } catch {
    return null;
  }
}

async function readBody(
  request: Request,
): Promise<{ body: unknown } | { error: string; status: number }> {
  if (
    request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !==
    "application/json"
  ) {
    return { error: "application/json 형식으로 보내주세요", status: 415 };
  }
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES)
    return { error: "요청이 너무 커요", status: 413 };
  const reader = request.body?.getReader();
  if (!reader) return { error: "요청 내용이 없어요", status: 400 };
  let bytes = 0;
  let text = "";
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => {});
        return { error: "요청이 너무 커요", status: 413 };
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return { body: JSON.parse(text) as unknown };
  } catch {
    return { error: "JSON 형식이 잘못됐어요", status: 400 };
  } finally {
    reader.releaseLock();
  }
}

export async function handleResultCard(
  request: Request,
  options: ServiceOptions = {},
): Promise<Response> {
  const read = await readBody(request);
  if ("error" in read)
    return Response.json({ error: read.error }, { status: read.status, headers: HEADERS });
  const validation = validateInput(read.body);
  if (!validation.ok)
    return Response.json({ error: validation.error }, { status: 400, headers: HEADERS });
  const { input } = validation;
  const fallback: ResultCardResponse = {
    card: makeFallbackCard(input.gameId, input.score),
    source: "fallback",
    gameDept: input.gameDept,
    score: input.score,
  };
  const respondFallback = () => Response.json(fallback, { headers: HEADERS });
  const key = options.apiKey?.trim();
  if (!key) return respondFallback();

  try {
    const department = departments.find((item) => item.id === input.gameDept)!;
    const response = await (options.fetcher ?? fetch)("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.any([
        request.signal,
        AbortSignal.timeout(options.timeoutMs ?? TIMEOUT_MS),
      ]),
      body: JSON.stringify({
        model: options.model?.trim() || DEFAULT_MODEL,
        store: false,
        max_output_tokens: 600,
        instructions: INSTRUCTIONS,
        input: JSON.stringify({
          department: department.name,
          game: input.gameId === "microscope" ? "식중독균 찾기" : "피싱 문자 판별",
          score: input.score,
          detail: input.detail,
        }),
        text: {
          format: { type: "json_schema", name: "result_card", strict: true, schema: CARD_SCHEMA },
        },
      }),
    });
    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      return respondFallback();
    }
    const card = parseAIResponse(await response.json());
    if (!card) return respondFallback();
    return Response.json(
      {
        card,
        source: "ai",
        gameDept: input.gameDept,
        score: input.score,
      } satisfies ResultCardResponse,
      { headers: HEADERS },
    );
  } catch {
    // 키 오류·호출 제한·네트워크·타임아웃·JSON 오류는 모두 같은 형식의 기본 카드로 복구한다.
    return respondFallback();
  }
}
