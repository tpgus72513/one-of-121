import "server-only";
import { handleResultCard } from "./service";

// 담당: B · API 키는 이 서버 진입점에서만 읽는다.
export async function POST(request: Request) {
  return handleResultCard(request, {
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL,
  });
}
