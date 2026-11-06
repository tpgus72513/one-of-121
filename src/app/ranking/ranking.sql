-- 담당: C · 랭킹용 view 2개 (기획서 4장 [랭킹])
-- plays.sql(A) 를 먼저 실행한 다음, Supabase SQL Editor 에 통째로 붙여넣고 Run. 한 번만 하면 된다.
--
-- view = 저장된 질의. 표처럼 읽을 수 있다.
-- security_invoker = true → 읽는 사람 권한으로 plays 를 읽는다 → plays 의 RLS(누구나 읽기만)가 그대로 적용된다.

-- 1) 개인 TOP 10 — 같은 닉네임·학과는 최고 점수 한 번만
create or replace view ranking_top10 with (security_invoker = true) as
select nickname, real_dept, game_dept, score, created_at
from (
  select distinct on (nickname, real_dept) nickname, real_dept, game_dept, score, created_at
  from plays
  order by nickname, real_dept, score desc, created_at asc
) best
order by score desc, created_at asc
limit 10;

-- 2) 세종캠 학과 대항전 — "내 학과"(real_dept)별 평균 점수
create or replace view ranking_depts with (security_invoker = true) as
select real_dept, count(*)::int as plays, round(avg(score), 1)::float as avg_score
from plays
group by real_dept
order by avg_score desc, plays desc;
