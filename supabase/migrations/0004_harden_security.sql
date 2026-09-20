-- QA 리뷰에서 발견된 구멍 두 개를 막는다.
-- 1) players INSERT가 with check(true)라 클라이언트가 xp/coins/level을 마음대로 채워서 계정을 만들 수 있었다.
-- 2) challenges INSERT도 with check(true)라 goal.value=0 같은 챌린지를 만들어 무한 파밍이 가능했다.
-- 둘 다 "새로 만들 때는 반드시 기본값/정상 범위여야 한다"는 제약으로 막는다.
-- (실력치를 바꾸는 값들은 여전히 submit-score 같은 서버 함수를 통해서만 바뀐다 — 이 마이그레이션은
--  그 서버 함수를 거치지 않고 처음부터 잘못된 값으로 row를 만드는 경로만 막는다.)

drop policy if exists "anyone can create a player" on players;
create policy "anyone can create a player with default stats" on players
  for insert
  with check (
    xp = 0 and coins = 0 and level = 1 and equipped = '{}'::jsonb
  );

drop policy if exists "anyone can create a challenge" on challenges;
create policy "anyone can create a valid challenge" on challenges
  for insert
  with check (
    status = 'active'
    and play_count = 0
    and (config->>'durationSec')::numeric between 5 and 30
    and (config->'goal'->>'value')::numeric between 1 and 999
    and (config->'params'->>'maxOnScreen')::numeric between 1 and 8
  );

create index if not exists idx_scores_player_cleared on scores(player_id, cleared);
