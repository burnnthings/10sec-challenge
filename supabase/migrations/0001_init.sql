create extension if not exists pgcrypto;

create table if not exists challenges (
  id             uuid primary key default gen_random_uuid(),
  short_code     text unique not null,
  config         jsonb not null,
  config_version int  not null default 1,
  status         text not null default 'active', -- active | hidden | removed
  play_count     int  not null default 0,
  created_at     timestamptz not null default now()
);

-- 정식 로그인 없이 시작하기 위한 최소 플레이어 식별자.
-- 클라이언트가 처음 방문할 때 하나 만들어 localStorage에 보관하고 계속 재사용한다.
-- 나중에 실제 인증을 붙일 때는 이 테이블에 auth 연동 컬럼만 추가하면 된다.
create table if not exists players (
  id         uuid primary key default gen_random_uuid(),
  nickname   text not null default 'Player',
  created_at timestamptz not null default now()
);

create table if not exists scores (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references challenges(id) on delete cascade,
  player_id    uuid not null references players(id) on delete cascade,
  score        int  not null,
  cleared      boolean not null,
  duration_ms  int  not null,
  flagged      boolean not null default false, -- 서버 검증에서 의심스러운 기록으로 판정됨
  created_at   timestamptz not null default now()
);

create table if not exists challenge_bests (
  challenge_id uuid not null references challenges(id) on delete cascade,
  player_id    uuid not null references players(id) on delete cascade,
  best_score   int  not null,
  cleared_at   timestamptz,
  primary key (challenge_id, player_id)
);

create index if not exists idx_scores_challenge on scores(challenge_id);
create index if not exists idx_challenge_bests_leaderboard on challenge_bests(challenge_id, best_score desc);

alter table challenges enable row level security;
alter table players enable row level security;
alter table scores enable row level security;
alter table challenge_bests enable row level security;

create policy "challenges are publicly readable" on challenges for select using (true);
create policy "anyone can create a challenge" on challenges for insert with check (true);

create policy "players are publicly readable" on players for select using (true);
create policy "anyone can create a player" on players for insert with check (true);

create policy "scores are publicly readable" on scores for select using (true);
create policy "challenge_bests are publicly readable" on challenge_bests for select using (true);

-- scores/challenge_bests에는 일부러 insert/update 정책을 열어두지 않는다.
-- 클라이언트가 점수를 직접 써넣을 수 있게 하면 치팅 방어가 무의미해지므로,
-- 반드시 supabase/functions/submit-score (서비스 롤 키 사용)를 통해서만 기록한다.
