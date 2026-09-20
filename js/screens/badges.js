import { getBadgeCatalog, getOrCreatePlayerId } from "../api/supabaseClient.js";
import { renderBadgeSVG } from "../badgeIcons.js";
import { navigate } from "../router.js";
import { t } from "../i18n.js";

export function initBadgesScreen() {
  document.getElementById("badges-home-btn").addEventListener("click", () => navigate("/"));
  document.getElementById("badges-heading").textContent = t("badges_heading");
  document.getElementById("badges-subtitle").textContent = t("badges_subtitle");

  const shareBtn = document.getElementById("badges-share-btn");
  shareBtn.textContent = t("badges_share_btn");
  shareBtn.addEventListener("click", async () => {
    const playerId = await getOrCreatePlayerId();
    navigate(`/p/${playerId}`);
  });

  async function renderBadges() {
    const playerId = await getOrCreatePlayerId();
    const badges = await getBadgeCatalog(playerId);
    const grid = document.getElementById("badges-grid");

    grid.innerHTML = badges
      .map((badge) => {
        const locked = !badge.earnedAt;
        return `
          <div class="badge-slot ${locked ? "" : "earned"}">
            ${renderBadgeSVG(badge.code, { size: 56, locked })}
            <span class="badge-name">${locked ? t("badge_locked") : badge.name}</span>
          </div>
        `;
      })
      .join("");
  }

  return { renderBadges };
}
