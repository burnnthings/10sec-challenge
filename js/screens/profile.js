import { getPublicProfile, getOrCreatePlayerId, updateNickname } from "../api/supabaseClient.js";
import { renderBadgeSVG } from "../badgeIcons.js";
import { navigate } from "../router.js";
import { t } from "../i18n.js";

const AVATAR_EMOJI = { fish: "🐟", star: "⭐", leaf: "🍃", coin: "🪙" };

// submit-score의 levelForXp()와 같은 곡선이어야 XP 바가 실제 레벨업 지점과 맞아떨어진다.
function totalXpForLevel(level) {
  return 50 * level * (level - 1);
}

export function initProfileScreen() {
  document.getElementById("profile-home-btn").addEventListener("click", () => navigate("/"));
  document.getElementById("profile-coins-label").textContent = t("profile_coins_label");
  document.getElementById("profile-clears-label").textContent = t("profile_clears_label");
  document.getElementById("profile-rank-label").textContent = t("profile_rank_label");
  document.getElementById("profile-badges-heading").textContent = t("profile_badges_heading");
  document.getElementById("profile-not-found").textContent = t("profile_not_found");

  const shareBtn = document.getElementById("profile-share-btn");
  shareBtn.textContent = t("share_btn");
  shareBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      const original = t("share_btn");
      shareBtn.textContent = t("share_copied");
      setTimeout(() => {
        shareBtn.textContent = original;
      }, 1200);
    } catch {
      // 클립보드 권한이 없으면 조용히 무시한다
    }
  });

  const editBtn = document.getElementById("profile-edit-nickname-btn");
  editBtn.textContent = t("profile_edit_nickname_btn");

  const contentSections = document.querySelectorAll("#page-profile .profile-content > *");
  const notFoundEl = document.getElementById("profile-not-found");

  async function renderProfile(playerId) {
    let profile;
    try {
      profile = await getPublicProfile(playerId);
    } catch {
      contentSections.forEach((el) => el.classList.add("hidden"));
      notFoundEl.classList.remove("hidden");
      return;
    }

    contentSections.forEach((el) => el.classList.remove("hidden"));
    notFoundEl.classList.add("hidden");

    document.getElementById("profile-avatar").textContent = AVATAR_EMOJI[profile.avatar_base] ?? "🐟";
    document.getElementById("profile-nickname").textContent = profile.nickname;
    document.getElementById("profile-level").textContent = `${t("profile_level_label")} ${profile.level}`;

    const currentLevelXp = totalXpForLevel(profile.level);
    const nextLevelXp = totalXpForLevel(profile.level + 1);
    const progress = Math.min(1, (profile.xp - currentLevelXp) / (nextLevelXp - currentLevelXp));
    document.getElementById("profile-xp-fill").style.width = `${Math.round(progress * 100)}%`;
    document.getElementById("profile-xp-label").textContent = `${profile.xp} / ${nextLevelXp} XP`;

    document.getElementById("profile-coins").textContent = profile.coins;
    document.getElementById("profile-clears").textContent = profile.clearCount;
    document.getElementById("profile-rank").textContent = `#${profile.worldRank}`;

    const myPlayerId = await getOrCreatePlayerId();
    const isMine = myPlayerId === playerId;
    editBtn.classList.toggle("hidden", !isMine);
    editBtn.onclick = isMine
      ? async () => {
          const next = window.prompt(t("profile_nickname_prompt"), profile.nickname);
          if (!next) return;
          try {
            await updateNickname(next);
            renderProfile(playerId);
          } catch (err) {
            window.alert(err?.message ?? String(err));
          }
        }
      : null;

    const grid = document.getElementById("profile-badges-grid");
    grid.innerHTML = profile.badges
      .map(
        (badge) => `
          <div class="badge-slot earned">
            ${renderBadgeSVG(badge.code, { size: 56 })}
            <span class="badge-name">${badge.name}</span>
          </div>
        `
      )
      .join("");
  }

  return { renderProfile };
}
