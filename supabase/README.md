# Supabase 연동 상태

프로젝트: `rpvjsjcclryxfxsghvln` (https://supabase.com/dashboard/project/rpvjsjcclryxfxsghvln)

- [x] 마이그레이션 적용 (`0001_init.sql`, `0002_profile_economy.sql`)
- [x] `submit-score` Edge Function 배포
- [x] `js/api/supabaseClient.js`에 URL/anon key 연결
- [x] `challengeStore.js`가 Supabase `challenges` 테이블을 사용하도록 교체
- [x] 점수 제출이 `submit-score` Edge Function(서버 검증)을 거치도록 교체, localStorage 기반 `storage.js` 삭제

## 다음에 다시 배포할 때

```bash
npx supabase login --token <personal-access-token>   # 또는 $env:SUPABASE_ACCESS_TOKEN 설정
npx supabase link --project-ref rpvjsjcclryxfxsghvln --password <DB 비밀번호>
npx supabase db push --linked                          # 새 마이그레이션 적용
npx supabase functions deploy submit-score              # Edge Function 재배포
```

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`는 Supabase가 모든 Edge Function에 자동으로 주입하므로
`supabase secrets set`으로 따로 설정할 필요가 없다.

## 다음 확장 (0002 스키마는 준비됐지만 아직 미연동)

프로필/뱃지/XP/코인/코스메틱 기능은 스키마만 있고 Edge Function과 프론트엔드 연동은 아직이다.
XP 지급량, 레벨업 곡선, 코인 지급량 등 실제 밸런스 수치를 정한 뒤 이어서 구현한다.
