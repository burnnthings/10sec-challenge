-- 시작용 뱃지. 전부 "누적 클리어 횟수" 기반이라 서버에서 scores 테이블만 세면 판정할 수 있다.
-- 이름/아이콘은 자리표시자이니 나중에 원하는 걸로 바꿔도 되고, unlock_rule.value만 조정해도 된다.
insert into badges (code, name, description, icon, rarity, unlock_rule) values
  ('first_clear', '첫 클리어',      '아무 챌린지나 처음으로 클리어했다',     '🎉', 'common',    '{"type":"clear_count","value":1}'),
  ('clear_10',    '클리어 10회',    '챌린지를 10번 클리어했다',            '🎮', 'common',    '{"type":"clear_count","value":10}'),
  ('clear_50',    '클리어 50회',    '챌린지를 50번 클리어했다',            '🏅', 'rare',      '{"type":"clear_count","value":50}'),
  ('clear_200',   '클리어 200회',   '챌린지를 200번 클리어했다',           '🏆', 'epic',      '{"type":"clear_count","value":200}'),
  ('clear_1000',  '클리어 1000회',  '챌린지를 1000번 클리어했다',          '👑', 'legendary', '{"type":"clear_count","value":1000}')
on conflict (code) do nothing;
