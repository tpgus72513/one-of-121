-- 담당: A · 플레이 기록 테이블 (기획서 7-3장)
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 Run. 한 번만 하면 된다.

create table if not exists plays (
  id          bigint generated always as identity primary key,
  nickname    text not null check (char_length(nickname) between 1 and 12),
  real_dept   text not null,        -- 사용자의 실제 학과 id (departments.json 의 id)
  game_dept   text not null,        -- 체험한 학과 id
  game_id     text not null,        -- 'phishing', 'microscope'
  score       int  not null check (score between 0 and 100),
  play_ms     int  not null check (play_ms > 0),  -- 시작~끝까지 걸린 시간(ms). 너무 빠른 기록 거르기용
  detail      jsonb,                -- 게임마다 다른 세부기록 (맞힌 수, 연속 정답 등)
  created_at  timestamptz not null default now()
);

-- 랭킹(학과별 평균)을 빨리 뽑으려고 거는 색인
create index if not exists plays_game_dept_idx on plays (game_dept);
create index if not exists plays_real_dept_idx on plays (real_dept);

-- RLS(행 단위 보안) 켜기.
-- 켜는 순간 "허락한 것만" 된다. 아래에서 읽기만 허락하고, 쓰기 정책은 일부러 안 만든다.
--   → 브라우저(anon 키)로는 점수를 직접 못 넣는다. 점수 조작 1차 방어.
--   → 저장은 서버(/api/plays)가 service role 키로 한다. service role 은 RLS 를 건너뛴다.
alter table plays enable row level security;

-- 랭킹 페이지가 읽을 수 있게 누구나 읽기 허용
drop policy if exists "plays are readable by everyone" on plays;
create policy "plays are readable by everyone" on plays
  for select using (true);
