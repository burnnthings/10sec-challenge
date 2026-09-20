const DICT = {
  ko: {
    start: "시작",
    retry: "다시 도전",
    ready_hint: "화면을 빠르게 터치해서 모아보세요!",
    score: "점수",
    best: "최고 기록",
    cleared: "클리어!",
    not_cleared: "다음에 도전!",
    time_left: "남은 시간",

    home_title: "10초 챌린지",
    home_subtitle: "나만의 10초 챌린지를 만들고 링크로 공유해보세요",
    home_create_btn: "챌린지 만들기",
    home_demo_btn: "데모 플레이",

    create_heading: "챌린지 만들기",
    label_title: "제목",
    label_duration: "제한 시간 (초)",
    label_goal: "목표 점수",
    label_speed: "이동 속도",
    label_spawn_rate: "등장 빈도",
    label_target_size: "타겟 크기",
    label_background: "배경 테마",
    label_character: "캐릭터",
    label_max_on_screen: "동시 등장 수",
    create_submit_btn: "만들고 공유하기",
    create_submitting: "만드는 중...",
    create_cancel_btn: "취소",

    share_btn: "링크 복사",
    share_copied: "복사됨!",
  },
  en: {
    start: "Start",
    retry: "Retry",
    ready_hint: "Tap the targets as fast as you can!",
    score: "Score",
    best: "Best",
    cleared: "Cleared!",
    not_cleared: "Try again!",
    time_left: "Time left",

    home_title: "10-Second Challenge",
    home_subtitle: "Create your own 10-second challenge and share it with a link",
    home_create_btn: "Create a challenge",
    home_demo_btn: "Play the demo",

    create_heading: "Create a challenge",
    label_title: "Title",
    label_duration: "Duration (sec)",
    label_goal: "Goal score",
    label_speed: "Speed",
    label_spawn_rate: "Spawn rate",
    label_target_size: "Target size",
    label_background: "Background theme",
    label_character: "Character",
    label_max_on_screen: "Max on screen",
    create_submit_btn: "Create & share",
    create_submitting: "Creating...",
    create_cancel_btn: "Cancel",

    share_btn: "Copy link",
    share_copied: "Copied!",
  },
};

const locale = (navigator.language || "ko").startsWith("ko") ? "ko" : "en";

export function t(key) {
  return DICT[locale][key] ?? key;
}
