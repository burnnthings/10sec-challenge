# 코스메틱 상점 / 제작 슬롯 / AdSense 기획 (초안)

> 근거: `migrations/0002_profile_economy.sql`, `0003_seed_badges.sql`, `functions/submit-score/index.ts`를 실제로 확인하고 작성. 아직 구현 전 — 이 문서를 보고 seed SQL과 Edge Function을 만들면 된다.

## A. cosmetic_items 시작 아이템 (슬롯당 6개, 총 48개)

모든 아이템은 `players.equipped`(jsonb)에 슬롯별로 코드 하나만 저장되는 순수 외형이며, 점수/속도 등 게임플레이 수치에는 절대 관여하지 않는다. `price_coins`가 null인 행은 `badge_required` 또는 `season_only`로만 획득한다.

| slot | code | name | rarity | price_coins | 획득 조건 |
|---|---|---|---|---|---|
| hair | hair_default | 기본 머리 | common | 0 | 가입 시 기본 지급 |
| hair | hair_spiky | 스파이크 머리 | common | 80 | 구매 |
| hair | hair_ponytail | 포니테일 | common | 100 | 구매 |
| hair | hair_curly_blue | 파란 곱슬머리 | rare | 250 | 구매 |
| hair | hair_mohawk_neon | 네온 모히칸 | epic | 600 | 구매 |
| hair | hair_golden_braid | 황금 왕관 땋기 | legendary | null | badge_required: `clear_1000` |
| outfit | outfit_basic_tee | 기본 티셔츠 | common | 0 | 가입 시 기본 지급 |
| outfit | outfit_hoodie | 후드티 | common | 90 | 구매 |
| outfit | outfit_tracksuit | 트레이닝복 | common | 120 | 구매 |
| outfit | outfit_wizard_robe | 마법사 로브 | rare | 300 | 구매 |
| outfit | outfit_astronaut | 우주복 | epic | 700 | 구매 |
| outfit | outfit_legend_armor | 전설의 갑옷 | legendary | null | badge_required: `clear_200` |
| hat | hat_none | 없음 | common | 0 | 가입 시 기본 지급 |
| hat | hat_cap | 야구모자 | common | 80 | 구매 |
| hat | hat_beanie | 비니 | common | 100 | 구매 |
| hat | hat_party_cone | 파티 고깔 | rare | 220 | 구매 |
| hat | hat_wizard | 마법사 모자 | epic | 550 | 구매 |
| hat | hat_legend_crown | 전설의 왕관(반짝임 효과) | legendary | null | badge_required: `clear_1000` |
| face | face_smile | 기본 미소 | common | 0 | 가입 시 기본 지급 |
| face | face_wink | 윙크 | common | 60 | 구매 |
| face | face_surprised | 놀란 표정 | common | 60 | 구매 |
| face | face_cool_shades | 쿨한 선글라스 | rare | 200 | 구매 |
| face | face_determined | 결의에 찬 표정 | epic | 450 | 구매 |
| face | face_star_eyes | 반짝이는 별눈 | legendary | null | badge_required: `clear_50` |
| effect | effect_none | 없음 | common | 0 | 가입 시 기본 지급 |
| effect | effect_sparkle_trail | 반짝이는 이동 트레일 | rare | 300 | 구매 |
| effect | effect_confetti_clear | 클리어 시 색종이 폭죽 | rare | 350 | 구매 |
| effect | effect_flame_aura | 불꽃 오라 | epic | 650 | 구매 |
| effect | effect_rainbow_glow | 무지개 글로우 | epic | 750 | 구매 |
| effect | effect_golden_shimmer | 황금 반짝임 | legendary | null | badge_required: `clear_1000` |
| speech_bubble | speech_default | 기본 말풍선 | common | 0 | 가입 시 기본 지급 |
| speech_bubble | speech_comic | 만화체 말풍선 | common | 100 | 구매 |
| speech_bubble | speech_neon | 네온 말풍선 | rare | 280 | 구매 |
| speech_bubble | speech_pixel | 픽셀 말풍선 | rare | 280 | 구매 |
| speech_bubble | speech_gold_frame | 금테 말풍선 | epic | 600 | 구매 |
| speech_bubble | speech_champion | 챔피언 말풍선 | season | null | season_only: true |
| border | border_none | 없음 | common | 0 | 가입 시 기본 지급 |
| border | border_simple_ring | 심플 링 | common | 100 | 구매 |
| border | border_dotted | 점선 테두리 | common | 120 | 구매 |
| border | border_flame | 불꽃 테두리 | rare | 320 | 구매 |
| border | border_diamond | 다이아몬드 테두리 | epic | 700 | 구매 |
| border | border_season_champion | 시즌 챔피언 테두리 | season | null | season_only: true (해당 시즌 랭킹 보상) |
| border | border_world_top100 | 세계 랭킹 TOP 100 칭호 테두리 | legendary | null | badge_required: `world_rank_top100`(신규 뱃지 필요) |
| nickname_color | nickname_default | 기본(흰색) | common | 0 | 가입 시 기본 지급 |
| nickname_color | nickname_blue | 파랑 | common | 80 | 구매 |
| nickname_color | nickname_green | 초록 | common | 80 | 구매 |
| nickname_color | nickname_purple_grad | 보라 그라데이션 | rare | 250 | 구매 |
| nickname_color | nickname_rainbow | 무지개(애니메이션) | epic | 600 | 구매 |
| nickname_color | nickname_gold | 금색 | legendary | null | badge_required: `clear_1000` |

## B. 제작 슬롯 지급 규칙 (`slot_grants.reason` 기준)

기본 보유 슬롯 = 1(하드코딩) + `slot_grants` 합계(만료되지 않은 것). 사용 슬롯 = 해당 플레이어가 만든 `challenges` 중 `status != 'removed'` 개수.

| 조건 | reason | 지급 슬롯 수 | 구분 | 비고 |
|---|---|---|---|---|
| 가입 즉시 | signup_bonus | 1 | 영구 | 1회성, 최초 프로필 생성 시 서버에서 지급 |
| 광고 시청 1회 | ad_watch | 1 | 임시 (24시간) | 하루 최대 3회 (추후 3~5회 튜닝), 자정(KST) 기준 리셋, granted_at+24h로 만료 판정 |
| 내가 만든 챌린지 누적 플레이 100회 | play_milestone | 1 | 영구 | 챌린지 1개 단위가 아니라 플레이어가 만든 모든 챌린지 play_count 합산 |
| 내가 만든 챌린지 누적 플레이 1,000회 | play_milestone | 1 | 영구 | 위 단계와 별개로 중복 지급 (누적 2개) |
| 내가 만든 챌린지 누적 플레이 10,000회 | play_milestone | 2 | 영구 | "인기 제작자" 1단계 진입 조건 겸용 |
| 내가 만든 챌린지 누적 좋아요 100개 | like_milestone | 1 | 영구 | likes 집계 테이블 신규 필요 (아래 D 참고) |
| 내가 만든 챌린지 누적 좋아요 1,000개 | like_milestone | 2 | 영구 | |
| 인기 제작자 등급 (누적 플레이 10,000+ AND 좋아요 1,000+ 동시 달성) | reason enum에 값 없음 | +3~5 | 영구 | **enum에 `creator_tier_bonus` 추가 권장.** |
| 시즌 종료 랭킹 보상 (예: 시즌 TOP 100) | season_bonus | 1~2 | 시즌 임시 또는 영구 선택 | 다음 시즌 시작 전 만료시키려면 expires_at 필요 |

## C. AdSense(리워드형) 배치 지점

플레이 도중에는 배치하지 않는다는 원칙을 지켜 아래 4곳만 사용한다.

| 위치 | 광고 유형 | 트리거 | 보상 |
|---|---|---|---|
| 챌린지 만들기 화면, 슬롯 부족 모달 | 리워드형 전면 광고 | "슬롯이 없습니다" 안내에서 "광고 보고 슬롯 +1" 버튼 클릭 | ad_watch 슬롯 +1 (일 3회 한도) |
| 플레이 결과 화면 (클리어/실패 직후) | 리워드형 전면 광고 | "광고 보고 코인 2배 받기" 버튼 (선택, 스킵 가능) | 해당 판 코인 보상 2배 |
| 코스메틱 상점 진입 화면 | 리워드형 전면 광고 | "무료 코인 받기" 버튼 | 코인 +50~100 (일 2회 한도) |
| 랭킹 화면 하단 | 일반 디스플레이 배너 (비보상) | 화면 진입 시 자동 노출 | 없음 (순수 지면 수익) |

## D. 구현 전 확인된 스키마 gap

1. **challenges에 제작자 식별 컬럼 없음** — `challenges.creator_id uuid references players(id)` 추가 필요.
2. **likes 테이블 없음** — `likes(challenge_id, player_id, created_at, primary key(challenge_id, player_id))` 신규.
3. **slot_grants에 만료 컬럼 없음** — `ad_watch`(임시 24시간)용 `expires_at timestamptz` 컬럼 추가 권장.
4. **reason enum 확장 필요** — "인기 제작자 등급" 보너스용 `creator_tier_bonus` 값 추가.
5. **신규 Edge Function 2개** — `purchase-cosmetic`(코인 차감 + player_cosmetics insert), `grant-ad-slot`(광고 SDK 콜백 검증 후 slot_grants insert, 일일 한도는 서버에서 강제).
6. **뱃지 추가 필요** — `world_rank_top100` 등 `unlock_rule.type: "world_rank"` 뱃지를 랭킹 화면 구현 시 함께 시딩.
