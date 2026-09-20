-- 프로필/뱃지/XP/코인/코스메틱/제작 슬롯. 0001의 테이블은 건드리지 않고 확장만 한다.

alter table players
  add column if not exists country     char(2),
  add column if not exists level       int not null default 1,
  add column if not exists xp          int not null default 0,
  add column if not exists coins       int not null default 0,
  add column if not exists avatar_base text not null default 'fish',
  add column if not exists equipped    jsonb not null default '{}'::jsonb; -- {hair, outfit, hat, face, effect, speech_bubble, border, nickname_color}

-- 뱃지 정의. unlock_rule은 서버(Edge Function)가 해석한다 — 클라이언트는 절대 스스로 뱃지를 못 얻는다.
-- 예: {"type":"clear_count","value":10} / {"type":"challenge_clear","challenge_id":"..."} / {"type":"world_rank","value":10}
create table if not exists badges (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  name        text not null,
  description text,
  icon        text not null, -- 이모지 또는 아이콘 코드
  rarity      text not null default 'common',
  unlock_rule jsonb not null,
  created_at  timestamptz not null default now()
);

create table if not exists player_badges (
  player_id  uuid not null references players(id) on delete cascade,
  badge_id   uuid not null references badges(id) on delete cascade,
  earned_at  timestamptz not null default now(),
  primary key (player_id, badge_id)
);

-- 코스메틱 카탈로그. 전부 "외형만" 바뀌는 아이템 — 능력치에 영향을 주는 필드는 절대 두지 않는다.
create table if not exists cosmetic_items (
  id             uuid primary key default gen_random_uuid(),
  slot           text not null check (slot in ('hair','outfit','hat','face','effect','speech_bubble','border','nickname_color')),
  code           text unique not null,
  name           text not null,
  rarity         text not null default 'common', -- common | rare | epic | legendary | season
  price_coins    int,                              -- null이면 코인으로 못 사고 badge_required/season_only로만 획득
  badge_required uuid references badges(id),
  season_only    boolean not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists player_cosmetics (
  player_id   uuid not null references players(id) on delete cascade,
  item_id     uuid not null references cosmetic_items(id) on delete cascade,
  acquired_at timestamptz not null default now(),
  primary key (player_id, item_id)
);

-- 제작 슬롯은 누적 카운터가 아니라 "왜 늘었는지" 이력을 남기는 원장(ledger) 방식으로 관리한다.
-- 사용한 슬롯 수는 challenges에서 player가 만든 개수를 세면 되고, 보유 슬롯 수는 이 테이블 합계 + 기본 1개다.
create table if not exists slot_grants (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  amount     int not null default 1,
  reason     text not null check (reason in ('signup_bonus','ad_watch','play_milestone','like_milestone','season_bonus')),
  granted_at timestamptz not null default now()
);

create index if not exists idx_player_badges_player on player_badges(player_id);
create index if not exists idx_player_cosmetics_player on player_cosmetics(player_id);
create index if not exists idx_slot_grants_player on slot_grants(player_id);
create index if not exists idx_players_xp_rank on players(xp desc);

alter table badges enable row level security;
alter table player_badges enable row level security;
alter table cosmetic_items enable row level security;
alter table player_cosmetics enable row level security;
alter table slot_grants enable row level security;

create policy "badges are publicly readable" on badges for select using (true);
create policy "player_badges are publicly readable" on player_badges for select using (true);
create policy "cosmetic_items are publicly readable" on cosmetic_items for select using (true);
create policy "player_cosmetics are publicly readable" on player_cosmetics for select using (true);
create policy "slot_grants are publicly readable" on slot_grants for select using (true);

-- player_badges/player_cosmetics/slot_grants/players.xp,coins,level에는 일부러 insert/update 정책을 열지 않는다.
-- 전부 서버(Edge Function, 서비스 롤 키)를 통해서만 바뀐다 — 그래야 "클리어 → XP/코인/뱃지" 보상이 조작되지 않는다.
-- 코스메틱 구매(코인 차감 + player_cosmetics insert)도 같은 이유로 Edge Function으로 뺀다 (예: purchase-cosmetic).
