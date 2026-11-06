import { createClient } from "@supabase/supabase-js";

// 읽기 전용 Supabase 연결 (anon 키). 랭킹처럼 "누구나 읽어도 되는 것"만 읽는다.
// 쓰기는 /api/plays 가 service role 키로 따로 한다 (A 담당).
// 키가 없으면(아직 연결 전) null → 화면에서 "준비 중"으로 보여준다.
export function createReadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}
